#nullable enable
// Run (dry run):   dotnet script Codemod_PermissionsRegistrations_Rewrite.csx -- --root="~/repo"
// Apply changes:   dotnet script Codemod_PermissionsRegistrations_Rewrite.csx -- --root="~/repo" --write
// Optional flags:  --preview   (show focused before/after snippet per file changed)

using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Threading.Tasks;

// ---------------- helpers (same style as your working script) ----------------
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

static IEnumerable<string> EnumerateCsFiles(string root)
{
    var stack = new Stack<string>();
    stack.Push(root);

    while (stack.Count > 0)
    {
        var dir = stack.Pop();
        var dn = Path.GetFileName(dir).ToLowerInvariant();
        if (dn is "bin" or "obj" or ".git" or "node_modules") continue;

        string[] subs;
        try { subs = Directory.GetDirectories(dir); } catch { continue; }
        foreach (var s in subs) stack.Push(s);

        string[] files;
        try { files = Directory.GetFiles(dir, "*.cs"); } catch { continue; }
        foreach (var f in files) yield return f;
    }
}

// ---------------- rules ----------------
// Whitespace/newline tolerant, anchored on concrete map names to avoid false positives.
// We deliberately look for c.GetService<IRolesRepository<...>>() with any spacing; if your code also uses GetRequiredService,
// this script can be trivially extended with an alternate pattern per rule.
static readonly RegexOptions Rx = RegexOptions.Singleline | RegexOptions.Compiled;

static readonly (Regex pattern, string replacement, string tag)[] Rules = new (Regex, string, string)[]
{
    // Financial
    (
        new Regex(
            @"services\s*\.?\s*AddSingleton\s*<\s*IPermissionsRepository\s*<\s*FinancialPermission\s*>\s*>\s*\(\s*c\s*=>\s*new\s+PermissionsRepository\s*<\s*FinancialPermission\s*,\s*FinancialRole\s*>\s*\(\s*c\s*\.?\s*GetService\s*<\s*IRolesRepository\s*<\s*FinancialRole\s*>\s*>\s*\(\s*\)\s*,\s*FinancialRolesToPermissionsMap\s*\.?\s*Permissions\s*\)\s*\)\s*;",
            Rx
        ),
        "services.AddFinancialPermissionsRepository<Configuration>(cfg => cfg.UseOryNetwork, cfg => cfg.ApartmentId);",
        "Financial"
    ),

    // Sfc
    (
        new Regex(
            @"services\s*\.?\s*AddSingleton\s*<\s*IPermissionsRepository\s*<\s*SfcPermission\s*>\s*>\s*\(\s*c\s*=>\s*new\s+PermissionsRepository\s*<\s*SfcPermission\s*,\s*SfcRole\s*>\s*\(\s*c\s*\.?\s*GetService\s*<\s*IRolesRepository\s*<\s*SfcRole\s*>\s*>\s*\(\s*\)\s*,\s*SfcRolesToPermissionsMap\s*\.?\s*Permissions\s*\)\s*\)\s*;",
            Rx
        ),
        "services.AddSfcPermissionsRepository<Configuration>(cfg => cfg.UseOryNetwork, cfg => cfg.ApartmentId);",
        "Sfc"
    ),

    // Supply
    (
        new Regex(
            @"services\s*\.?\s*AddSingleton\s*<\s*IPermissionsRepository\s*<\s*SupplyPermission\s*>\s*>\s*\(\s*c\s*=>\s*new\s+PermissionsRepository\s*<\s*SupplyPermission\s*,\s*SupplyRole\s*>\s*\(\s*c\s*\.?\s*GetService\s*<\s*IRolesRepository\s*<\s*SupplyRole\s*>\s*>\s*\(\s*\)\s*,\s*SupplyRolesToPermissionsMap\s*\.?\s*Permissions\s*\)\s*\)\s*;",
            Rx
        ),
        "services.AddSupplyPermissionsRepository<Configuration>(cfg => cfg.UseOryNetwork, cfg => cfg.ApartmentId);",
        "Supply"
    ),
};

// Quick idempotency check: if any of the new helpers already appear, we'll consider the file compliant for that rule.
static readonly string[] NewHelpersPresence =
{
    "AddFinancialPermissionsRepository<Configuration>(",
    "AddSfcPermissionsRepository<Configuration>(",
    "AddSupplyPermissionsRepository<Configuration>(",
};

// ---------------- args & runner ----------------
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

int updated = 0, skipped = 0, noted = 0;
var files = EnumerateCsFiles(rootPath);

// Optional pre-filter to avoid opening big files unnecessarily
foreach (var file in files)
{
    string code;
    try { code = await File.ReadAllTextAsync(file); }
    catch { continue; }

    // Fast-path: if none of the old anchors nor new helpers are present, skip
    bool maybeContainsLegacy =
        code.Contains("AddSingleton<IPermissionsRepository<FinancialPermission>>", StringComparison.Ordinal) ||
        code.Contains("AddSingleton<IPermissionsRepository<SfcPermission>>", StringComparison.Ordinal) ||
        code.Contains("AddSingleton<IPermissionsRepository<SupplyPermission>>", StringComparison.Ordinal);

    bool alreadyNew = NewHelpersPresence.Any(h => code.Contains(h, StringComparison.Ordinal));

    if (!maybeContainsLegacy && !alreadyNew)
    {
        // Nothing interesting
        continue;
    }

    // Apply replacements
    int replacements = 0;
    var details = new StringBuilder();
    string current = code;

    foreach (var (pattern, replacement, tag) in Rules)
    {
        var matches = pattern.Matches(current);
        if (matches.Count == 0) continue;

        // If the new helper (for this domain) already exists nearby, we still replace the old occurrences
        // to remove coexistence; idempotency is guaranteed because once replaced the regex no longer matches.
        current = pattern.Replace(current, replacement);
        replacements += matches.Count;

        details.Append($"{tag}:{matches.Count} ");
        if (preview)
        {
            // Show a compact before/after sample for the first match
            string beforeSnippet = SquashWhitespace(matches[0].Value.Trim());
            string afterSnippet = replacement;
            details.AppendLine()
                   .AppendLine("---- before ----")
                   .AppendLine(beforeSnippet)
                   .AppendLine("++++ after ++++")
                   .AppendLine(afterSnippet);
        }
    }

    if (replacements == 0)
    {
        if (alreadyNew)
        {
            Console.WriteLine($"↷ Skipped {file} (already compliant)");
            skipped++;
        }
        else
        {
            Console.WriteLine($"ℹ Note  {file} (no matching legacy registrations found)");
            noted++;
        }
        continue;
    }

    if (write)
    {
        try
        {
            await File.WriteAllTextAsync(file, current, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
            Console.WriteLine($"✅ Updated {file}\n    {details.ToString().Trim()}");
            updated++;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error  {file}\n    {ex.Message}");
        }
    }
    else
    {
        Console.WriteLine($"✅ Would update {file}\n    {details.ToString().Trim()}  (use --write to apply)");
        updated++;
    }
}

Console.WriteLine();
Console.WriteLine($"Done. Updated: {updated}  Skipped: {skipped}  Notes: {noted}");

// ---------------- utils ----------------
static string SquashWhitespace(string s) => Regex.Replace(s, @"\s+", " ");
