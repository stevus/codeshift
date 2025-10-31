#nullable enable
// Run (dry run):   dotnet script Codemod_AddOryKetoClient.csx -- --root="~/repo" --preview
// Apply changes:   dotnet script Codemod_AddOryKetoClient.csx -- --root="~/repo" --write

using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Threading.Tasks;

// ---------- helpers (same style as your working scripts) ----------
static string ExpandUser(string path)
{
    if (string.IsNullOrWhiteSpace(path)) return path;
    if (path == "~")
    {
        var home = Environment.GetEnvironmentVariable("HOME")
                   ?? Environment.GetEnvironmentVariable("USERPROFILE")
                   ?? "";
        return home;
    }
    if (path.StartsWith("~" + Path.DirectorySeparatorChar))
    {
        var home = Environment.GetEnvironmentVariable("HOME")
                   ?? Environment.GetEnvironmentVariable("USERPROFILE")
                   ?? "";
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

static IEnumerable<string> EnumerateCsFiles(string root)
{
    var stack = new Stack<string>();
    stack.Push(root);

    while (stack.Count > 0)
    {
        var dir = stack.Pop();
        var dn = Path.GetFileName(dir).ToLowerInvariant();
        if (dn is "bin" or "obj" or ".git" or "node_modules") continue;

        string[] subdirs;
        try { subdirs = Directory.GetDirectories(dir); }
        catch { continue; }

        foreach (var s in subdirs) stack.Push(s);

        string[] files;
        try { files = Directory.GetFiles(dir, "*.cs"); }
        catch { continue; }

        foreach (var f in files) yield return f;
    }
}

static string GetIndentOfLine(string text, int indexWithinText)
{
    // Find the start of the line for the given index, then collect leading whitespace
    int lineStart = indexWithinText;
    while (lineStart > 0 && text[lineStart - 1] != '\n' && text[lineStart - 1] != '\r') lineStart--;
    int p = lineStart;
    while (p < text.Length && (text[p] == ' ' || text[p] == '\t')) p++;
    return text.Substring(lineStart, p - lineStart);
}

static string SquashWhitespace(string s) => Regex.Replace(s, @"\s+", " ");

// ---------- patterns ----------
var args = Environment.GetCommandLineArgs().Skip(1).ToArray();
bool write = args.Any(a => a.Equals("--write", StringComparison.OrdinalIgnoreCase));
bool preview = args.Any(a => a.Equals("--preview", StringComparison.OrdinalIgnoreCase));
var rootPath = ResolveRoot(args);

if (!Directory.Exists(rootPath))
{
    Console.Error.WriteLine($"Root directory not found: {rootPath}");
    Environment.Exit(2);
}

Console.WriteLine($"Scanning: {rootPath}");

var rxOpts = RegexOptions.Compiled | RegexOptions.Singleline;

// Match any registration like:
// services.AddSingleton<IRolesRepository<SupplyRole>, SomethingElse...>( ... );
var rolesRegRx = new Regex(
    @"services\s*\.\s*AddSingleton\s*<\s*IRolesRepository\s*<\s*(SupplyRole|SfcRole|FinancialRole)\s*>\s*(?:\s*,\s*[^>]+)?\s*>\s*\(.*?\)\s*;",
    rxOpts);

// Presence check for the new line (allowing arbitrary whitespace):
var ketoPresenceRx = new Regex(
    @"services\s*\.\s*AddOryKetoClient\s*<\s*Configuration\s*>\s*\(\s*cfg\s*=>\s*cfg\s*\.\s*OryKetoReadServiceUri\s*\)\s*;",
    rxOpts);

// The exact text we will insert:
const string KetoLine = "services.AddOryKetoClient<Configuration>(cfg => cfg.OryKetoReadServiceUri);";

int updated = 0, skipped = 0, noted = 0;

foreach (var file in EnumerateCsFiles(rootPath))
{
    string code;
    try { code = await File.ReadAllTextAsync(file); }
    catch { continue; }

    var matches = rolesRegRx.Matches(code);
    bool hasRolesRepoRegs = matches.Count > 0;
    bool hasKetoAlready = ketoPresenceRx.IsMatch(code);

    if (!hasRolesRepoRegs && !hasKetoAlready)
    {
        // Nothing of interest in this file
        continue;
    }

    if (hasKetoAlready)
    {
        // Already compliant (even if roles registrations exist)
        Console.WriteLine($"↷ Skipped {file} (already compliant)");
        skipped++;
        continue;
    }

    if (!hasRolesRepoRegs)
    {
        // We only add the line when roles regs are present
        Console.WriteLine($"ℹ Note  {file} (no IRolesRepository registrations to trigger insertion)");
        noted++;
        continue;
    }

    // Insert exactly once, after the LAST match; keep indentation consistent with that line
    var last = matches[matches.Count - 1];
    int insertPos = last.Index + last.Length;

    // Determine indentation from the line containing the last match
    string indent = GetIndentOfLine(code, last.Index);

    // Ensure we insert with a newline boundary
    string insertionText = Environment.NewLine + indent + KetoLine + Environment.NewLine;

    string newCode = code.Substring(0, insertPos) + insertionText + code.Substring(insertPos);

    if (preview && !write)
    {
        Console.WriteLine($"✅ Would update {file}");
        Console.WriteLine("    ---- before ----");
        Console.WriteLine("    " + SquashWhitespace(last.Value.Trim()));
        Console.WriteLine("    ++++ after ++++");
        Console.WriteLine("    " + KetoLine);
        updated++;
        continue;
    }

    if (write)
    {
        await File.WriteAllTextAsync(file, newCode, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
        Console.WriteLine($"✅ Updated {file}");
        updated++;
    }
    else
    {
        Console.WriteLine($"✅ Would update {file}  (use --write to apply)");
        updated++;
    }
}

Console.WriteLine();
Console.WriteLine($"Done. Updated: {updated}  Skipped: {skipped}  Notes: {noted}");
