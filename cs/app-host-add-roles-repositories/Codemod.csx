// ReplaceRolesRepositories.csx

using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

// -----------------------
// Args & Flags
// -----------------------
var argsDict = ParseArgs(Args); // Args is IList<string>; our overload accepts IEnumerable<string>
var rootArg = argsDict.TryGetValue("root", out var r) ? r : Directory.GetCurrentDirectory();
var root = ResolveRoot(rootArg);
var doWrite = argsDict.ContainsKey("write");
var doPreview = argsDict.ContainsKey("preview");

// -----------------------
// Patterns (compiled, singleline, whitespace tolerant)
// -----------------------
var ws = @"\s*";

Regex MakeLinePattern(string roleType, string repoType)
{
    // services.AddSingleton<IRolesRepository<RoleType>, RepoType>();
    var pattern =
        $@"services{ws}\.{ws}AddSingleton{ws}<{ws}IRolesRepository{ws}<{ws}{roleType}{ws}>{ws},{ws}{repoType}{ws}>{ws}\({ws}\){ws};";
    return new Regex(pattern, RegexOptions.Compiled | RegexOptions.Singleline);
}

Regex MakeAlreadyPattern(string methodName, string repoType)
{
    // services.AddXxx<Configuration, RepoType>(cfg => cfg.UseOryNetwork);
    var pattern =
        $@"services{ws}\.{ws}{methodName}{ws}<{ws}Configuration{ws},{ws}{repoType}{ws}>{ws}\({ws}cfg{ws}=>{ws}cfg{ws}\.{ws}UseOryNetwork{ws}\){ws};";
    return new Regex(pattern, RegexOptions.Compiled | RegexOptions.Singleline);
}

// Targets
var sfcFind = MakeLinePattern("SfcRole", "SfcRolesRepository");
var supplyFind = MakeLinePattern("SupplyRole", "SupplyRolesRepository");
var financialFind = MakeLinePattern("FinancialRole", "FinancialRolesRepository");

const string sfcReplace = "services.AddSfcRolesRepository<Configuration, SfcRolesRepository>(cfg => cfg.UseOryNetwork);";
const string supplyReplace = "services.AddSupplyRolesRepository<Configuration, SupplyRolesRepository>(cfg => cfg.UseOryNetwork);";
const string financialReplace = "services.AddFinancialRolesRepository<Configuration, FinancialRolesRepository>(cfg => cfg.UseOryNetwork);";

var sfcAlready = MakeAlreadyPattern("AddSfcRolesRepository", "SfcRolesRepository");
var supplyAlready = MakeAlreadyPattern("AddSupplyRolesRepository", "SupplyRolesRepository");
var financialAlready = MakeAlreadyPattern("AddFinancialRolesRepository", "FinancialRolesRepository");

// -----------------------
// Scan & Apply
// -----------------------
int updated = 0, skipped = 0, noted = 0;

var files = EnumerateCsFiles(root);
if (files.Count == 0)
{
    LogInfo($"No .cs files found under root: {root}");
    noted++;
}
else
{
    LogInfo($"Scanning {files.Count} .cs files under: {root}");
}

foreach (var file in files)
{
    var text = await File.ReadAllTextAsync(file);
    var original = text;

    bool hadAnyMatch = sfcFind.IsMatch(text) || supplyFind.IsMatch(text) || financialFind.IsMatch(text);
    bool alreadySfc = sfcAlready.IsMatch(text);
    bool alreadySupply = supplyAlready.IsMatch(text);
    bool alreadyFinancial = financialAlready.IsMatch(text);

    if (!alreadySfc && sfcFind.IsMatch(text))
        text = sfcFind.Replace(text, sfcReplace);

    if (!alreadySupply && supplyFind.IsMatch(text))
        text = supplyFind.Replace(text, supplyReplace);

    if (!alreadyFinancial && financialFind.IsMatch(text))
        text = financialFind.Replace(text, financialReplace);

    var changed = !ReferenceEquals(original, text) && original != text;

    if (changed)
    {
        if (doPreview) ShowPreview(file, original, text);

        if (doWrite)
        {
            await WriteUtf8NoBom(file, text);
            LogUpdated(file);
        }
        else
        {
            LogUpdated($"{file} (dry-run)");
        }
        updated++;
    }
    else
    {
        LogSkipped(file, (!hadAnyMatch || (alreadySfc || alreadySupply || alreadyFinancial))
            ? "already compliant"
            : "no effective change");
        skipped++;
    }
}

Console.WriteLine($"Done. Updated: {updated}  Skipped: {skipped}  Notes: {noted}");

// -----------------------
// Helpers
// -----------------------
static Dictionary<string,string> ParseArgs(IEnumerable<string> args)
{
    var dict = new Dictionary<string,string>(StringComparer.OrdinalIgnoreCase);
    foreach (var a in args)
    {
        if (!a.StartsWith("--")) continue;
        var eq = a.IndexOf('=');
        if (eq > 0)
        {
            var k = a.Substring(2, eq - 2);
            var v = a.Substring(eq + 1).Trim('"');
            dict[k] = v;
        }
        else
        {
            dict[a.Substring(2)] = "true";
        }
    }
    return dict;
}

static string ExpandUser(string path)
{
    if (string.IsNullOrWhiteSpace(path)) return path;
    if (path.StartsWith("~"))
    {
        var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        return Path.Combine(home, path.Substring(1).TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar));
    }
    return path;
}

static string ResolveRoot(string input)
{
    var p = ExpandUser(input);
    return Path.GetFullPath(p);
}

static List<string> EnumerateCsFiles(string root)
{
    var results = new List<string>(capacity: 1024);
    var skipDirs = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "bin", "obj", ".git", "node_modules"
    };

    var stack = new Stack<string>();
    stack.Push(root);

    while (stack.Count > 0)
    {
        var dir = stack.Pop();

        // Safely list subdirs
        IEnumerable<string> subdirs;
        try { subdirs = Directory.EnumerateDirectories(dir); }
        catch { continue; }

        foreach (var sub in subdirs)
        {
            var name = Path.GetFileName(sub);
            if (!skipDirs.Contains(name))
                stack.Push(sub);
        }

        // Safely list files
        IEnumerable<string> files;
        try { files = Directory.EnumerateFiles(dir, "*.cs"); }
        catch { continue; }

        results.AddRange(files);
    }

    return results;
}

static async Task WriteUtf8NoBom(string path, string content)
{
    var enc = new UTF8Encoding(encoderShouldEmitUTF8Identifier: false);
    await File.WriteAllTextAsync(path, content, enc);
}

static void LogUpdated(string msg) => Console.WriteLine($"✅ Updated {msg}");
static void LogSkipped(string file, string reason) => Console.WriteLine($"↷ Skipped {file} ({reason})");
static void LogInfo(string msg) => Console.WriteLine($"ℹ {msg}");

static string Squash(string s) =>
    Regex.Replace(s, @"\s+", " ").Trim();

static void ShowPreview(string file, string before, string after)
{
    static string Window(string s)
    {
        var idx = s.IndexOf("AddSfcRolesRepository", StringComparison.Ordinal);
        if (idx < 0) idx = s.IndexOf("AddSupplyRolesRepository", StringComparison.Ordinal);
        if (idx < 0) idx = s.IndexOf("IRolesRepository<", StringComparison.Ordinal);
        int start = Math.Max(0, idx >= 0 ? idx - 150 : 0);
        int len = Math.Min(300, Math.Max(0, s.Length - start));
        return s.Substring(start, len);
    }

    var b = Squash(Window(before));
    var a = Squash(Window(after));

    Console.WriteLine($"--- PREVIEW: {file}");
    Console.WriteLine($"   BEFORE: {b}");
    Console.WriteLine($"   AFTER : {a}");
}
