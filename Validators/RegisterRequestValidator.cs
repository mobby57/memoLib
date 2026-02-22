using System.Text.RegularExpressions;

namespace MemoLib.Api.Validators;

public static class RegisterRequestValidator
{
    public static (bool IsValid, string Error) Validate(string email, string password, string name)
    {
        if (string.IsNullOrWhiteSpace(email))
            return (false, "Email est requis");

        if (!IsValidEmail(email))
            return (false, "Format d'email invalide");

        if (string.IsNullOrWhiteSpace(password))
            return (false, "Mot de passe est requis");

        if (password.Length < 8)
            return (false, "Le mot de passe doit contenir au moins 8 caractères");

        if (!HasUpperCase(password) || !HasLowerCase(password) || !HasDigit(password))
            return (false, "Le mot de passe doit contenir majuscules, minuscules et chiffres");

        if (string.IsNullOrWhiteSpace(name))
            return (false, "Nom est requis");

        if (name.Length > 100)
            return (false, "Nom trop long (max 100 caractères)");

        return (true, string.Empty);
    }

    private static bool IsValidEmail(string email) =>
        Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$");

    private static bool HasUpperCase(string str) => str.Any(char.IsUpper);
    private static bool HasLowerCase(string str) => str.Any(char.IsLower);
    private static bool HasDigit(string str) => str.Any(char.IsDigit);
}
