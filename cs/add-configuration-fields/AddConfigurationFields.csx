#r "nuget: Microsoft.CodeAnalysis.CSharp.Workspaces, 4.10.0"
#r "nuget: Microsoft.CodeAnalysis.Workspaces.MSBuild, 4.10.0"
#nullable enable

using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

// ---------------- helper functions ----------------
static string ExpandUser(string path)
{
    if (string.IsNullOrWhiteSpace(path)) return path;
    if (path.StartsWith("~" + Path.DirectorySeparatorChar) || path == "~")
    {
        var home = Environment.GetEnvironmentVariable("HOME")
                   ?? Environment.GetEnvironmentVariable("USERPROFILE")
                   ?? "";
        if (path == "~") return home;
        return Path.Combine(home, path.Substring(2));
    }
    return path;
}

static string ResolveRoot(string[] args)
{
    var rootArg = args.FirstOrDefault(a => a.StartsWith("--root=", StringComparison.OrdinalIgnoreCase));
    if (!string.IsNullOrEmpty(rootArg))
    {
        var p = ExpandUser(rootArg.Substring("--root=".Length).Trim('"'));
        if (Directory.Exists(p)) return Path.GetFullPath(p);
    }
    var firstPositional = args.FirstOrDefault(a => !a.StartsWith("--"));
    if (!string.IsNullOrEmpty(firstPositional))
    {
        var p = ExpandUser(firstPositional);
        if (Directory.Exists(p)) return Path.GetFullPath(p);
        if (File.Exists(p)) return Directory.GetCurrentDirectory();
    }
    return Directory.GetCurrentDirectory();
}

// ---------------- members to insert ----------------
const string apartmentProp = "public string ApartmentId { get; set; }";
const string ketoProp = "public Uri OryKetoReadServiceUri { get; set; }";
const string useOryPropAndField = @"
public bool UseOryNetwork
{
    get { return _useOryNetwork.Value; }
}
bool? _useOryNetwork;
";

// StringKeyReader blocks
const string readerApartment = @"new StringKeyReader
{
    EnvironmentVariableKey = ""BR_APARTMENT_ID"",
    FriendlyName = ""apartment id"",
    Setter = (c, v) => c.ApartmentId = v,
    Validator = c =>
    {
        if (String.IsNullOrEmpty(c.ApartmentId))
            throw new Exception(""Missing Apartment Id"");
    },
},";
const string readerKeto = @"new StringKeyReader
{
    EnvironmentVariableKey = ""ORY_KETO_READ_SERVICE_URI"",
    FriendlyName = ""OryKetoReadServiceUri"",
    Setter = (c, v) =>
    {
        Uri val;
        if (Uri.TryCreate(v, UriKind.Absolute, out val))
            c.OryKetoReadServiceUri = val;
    },
    Validator = c =>
    {
        if (c.OryKetoReadServiceUri == null)
            throw new Exception(""OryKetoReadServiceUri"");
    },
},";
const string readerUseOry = @"new StringKeyReader
{
    EnvironmentVariableKey = ""USE_ORY_NETWORK"",
    FriendlyName = ""UseOryNetwork"",
    Setter = (c, v) =>
    {
        bool val;
        if (bool.TryParse(v, out val))
            c._useOryNetwork = val;
    },
    Validator = c =>
    {
        if (c._useOryNetwork == null)
            throw new Exception(""UseOryNetwork"");
    },
},";

// ---------------- tiny text inserter for StringReaders ----------------
static string InsertReadersIntoStringReaders(string code, out bool modified)
{
    modified = false;

    // Find the identifier first (field or prop or assignment)
    var idPos = code.IndexOf("StringReaders", StringComparison.Ordinal);
    if (idPos < 0) return code;

    // Find '=' after the identifier (handles field/prop initializer; for static ctor we still see '=' on the assignment)
    var eqPos = code.IndexOf('=', idPos);
    if (eqPos < 0) return code;

    // Find the first '{' after '=' (beginning of initializer body)
    var openPos = code.IndexOf('{', eqPos);
    if (openPos < 0) return code;

    // Walk braces to find the matching closing '}'
    int depth = 0;
    int closePos = -1;
    for (int i = openPos; i < code.Length; i++)
    {
        char ch = code[i];
        if (ch == '{') depth++;
        else if (ch == '}')
        {
            depth--;
            if (depth == 0) { closePos = i; break; }
        }
        else if (ch == '"' )
        {
            // skip string literals safely
            i++;
            while (i < code.Length)
            {
                if (code[i] == '\\') { i += 2; continue; }
                if (code[i] == '"') break;
                i++;
            }
        }
        else if (ch == '\'' )
        {
            // skip char literals
            i++;
            while (i < code.Length && code[i] != '\'')
            {
                if (code[i] == '\\') i++; // skip escape
                i++;
            }
        }
        // comments are rare here; we keep it simple
    }
    if (closePos < 0) return code;

    // Current contents inside braces
    var inner = code.Substring(openPos + 1, closePos - openPos - 1);

    // If the keys already exist, do not add again
    bool hasApt  = inner.Contains(@"""BR_APARTMENT_ID""", StringComparison.Ordinal);
    bool hasKeto = inner.Contains(@"""ORY_KETO_READ_SERVICE_URI""", StringComparison.Ordinal);
    bool hasUse  = inner.Contains(@"""USE_ORY_NETWORK""", StringComparison.Ordinal);

    if (hasApt && hasKeto && hasUse) return code;

    // Determine indentation (indent new entries like the first line after '{', or fallback to the line of '{')
    string GetIndentAt(int pos)
    {
        int lineStart = pos;
        while (lineStart > 0 && code[lineStart - 1] != '\n' && code[lineStart - 1] != '\r') lineStart--;
        int s = lineStart;
        while (s < code.Length && (code[s] == ' ' || code[s] == '\t')) s++;
        return code.Substring(lineStart, s - lineStart);
    }

    // Prefer indent of the first element if present; else indent from the '{' line plus 4 spaces
    string indent;
    {
        // find first non-whitespace within inner
        int k = 0;
        while (k < inner.Length && char.IsWhiteSpace(inner[k])) k++;
        if (k < inner.Length)
        {
            // indent is the whitespace on that line in the original code
            indent = GetIndentAt(openPos + 1 + k);
        }
        else
        {
            indent = GetIndentAt(openPos) + "    ";
        }
    }

    // Build insertion block (only missing ones), keep a leading newline if needed
    var toInsertLines = new List<string>();
    if (!hasApt)  toInsertLines.Add(indent + readerApartment.Replace("\n", "\n" + indent).TrimEnd());
    if (!hasKeto) toInsertLines.Add(indent + readerKeto.Replace("\n", "\n" + indent).TrimEnd());
    if (!hasUse)  toInsertLines.Add(indent + readerUseOry.Replace("\n", "\n" + indent).TrimEnd());

    string joiner;
    // If the list is empty or ends with a newline already, we ensure proper spacing
    if (inner.Trim().Length == 0)
        joiner = "\n";
    else if (!inner.EndsWith("\n"))
        joiner = "\n";
    else
        joiner = "";

    var insertionText = (joiner.Length == 0 ? "" : joiner) + string.Join("\n", toInsertLines) + "\n";

    // Insert before the closing brace
    var result = code.Substring(0, closePos) + insertionText + code.Substring(closePos);
    modified = true;
    return result;
}

// ---------------- main ----------------
var args = Environment.GetCommandLineArgs().Skip(1).ToArray();
Console.WriteLine("Args: " + string.Join(" | ", args));
var rootPath = ResolveRoot(args);

if (!Directory.Exists(rootPath))
{
    Console.Error.WriteLine($"Root directory not found: {rootPath}");
    Environment.Exit(2);
}

Console.WriteLine($"Scanning: {rootPath}");

var files = Directory.GetFiles(rootPath, "Configuration.cs", SearchOption.AllDirectories);
Console.WriteLine($"Found {files.Length} Configuration.cs files.");

foreach (var file in files)
{
    var code = await File.ReadAllTextAsync(file);
    var tree = CSharpSyntaxTree.ParseText(code);
    var rootNode = await tree.GetRootAsync();

    var classDecls = rootNode.DescendantNodes()
        .OfType<ClassDeclarationSyntax>()
        .Where(c => c.Identifier.Text == "Configuration")
        .ToList();

    if (classDecls.Count == 0)
    {
        // still attempt the simple insertion in case the file has the field outside class (unlikely)
        bool mod;
        var simple = InsertReadersIntoStringReaders(code, out mod);
        if (mod)
        {
            await File.WriteAllTextAsync(file, simple);
            Console.WriteLine($"✅ Updated (readers only) {file}");
        }
        else
        {
            Console.WriteLine($"↷ Skipped {file} (no Configuration class and readers unchanged).");
        }
        continue;
    }

    bool modifiedFile = false;
    var currentRoot = rootNode;

    foreach (var classDecl in classDecls)
    {
        var props = classDecl.Members.OfType<PropertyDeclarationSyntax>().ToList();
        var fields = classDecl.Members.OfType<FieldDeclarationSyntax>().ToList();

        bool hasApartmentId = props.Any(p => p.Identifier.Text == "ApartmentId");
        bool hasKetoUri     = props.Any(p => p.Identifier.Text == "OryKetoReadServiceUri");
        bool hasUseOryProp  = props.Any(p => p.Identifier.Text == "UseOryNetwork");
        bool hasUseOryField = fields.SelectMany(f => f.Declaration.Variables)
                                    .Any(v => v.Identifier.Text == "_useOryNetwork");

        var toAdd = new List<MemberDeclarationSyntax>();
        if (!hasApartmentId) toAdd.Add(SyntaxFactory.ParseMemberDeclaration(apartmentProp)!);
        if (!hasKetoUri)     toAdd.Add(SyntaxFactory.ParseMemberDeclaration(ketoProp)!);
        if (!hasUseOryProp || !hasUseOryField)
            toAdd.Add(SyntaxFactory.ParseMemberDeclaration(useOryPropAndField)!);

        // Find the StringReaders member to position before
        var stringReadersMember = classDecl.Members
            .FirstOrDefault(m =>
                (m is FieldDeclarationSyntax f  && f.Declaration.Variables.Any(v => v.Identifier.Text == "StringReaders")) ||
                (m is PropertyDeclarationSyntax p && p.Identifier.Text == "StringReaders")
            );

        ClassDeclarationSyntax updatedClass = classDecl;

        if (toAdd.Count > 0)
        {
            if (stringReadersMember != null)
            {
                var members = classDecl.Members;
                var idx = members.IndexOf(stringReadersMember);
                var newMembers = SyntaxFactory.List<MemberDeclarationSyntax>(
                    members.Take(idx).Concat(toAdd).Concat(members.Skip(idx))
                );
                updatedClass = classDecl.WithMembers(newMembers);
            }
            else
            {
                updatedClass = classDecl.AddMembers(toAdd.ToArray());
            }
        }

        if (!updatedClass.IsEquivalentTo(classDecl))
        {
            currentRoot = currentRoot.ReplaceNode(classDecl, updatedClass);
            modifiedFile = true;
        }
    }

    // After AST changes, do the SIMPLE text insertion for readers on the updated code string.
    var updatedCode = currentRoot.NormalizeWhitespace().ToFullString();
    bool readersMod;
    updatedCode = InsertReadersIntoStringReaders(updatedCode, out readersMod);
    if (readersMod) modifiedFile = true;

    if (modifiedFile)
    {
        await File.WriteAllTextAsync(file, updatedCode);
        Console.WriteLine($"✅ Updated {file}");
    }
    else
    {
        Console.WriteLine($"↷ Skipped {file} (already had members and readers).");
    }
}

Console.WriteLine("Done.");
