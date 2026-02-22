using System.Security.Cryptography;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;

namespace MemoLib.Api.Services;

public class PasswordService
{
    public string HashPassword(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(128 / 8);
        
        string hashed = Convert.ToBase64String(KeyDerivation.Pbkdf2(
            password: password,
            salt: salt,
            prf: KeyDerivationPrf.HMACSHA256,
            iterationCount: 100000,
            numBytesRequested: 256 / 8));
        
        return $"{Convert.ToBase64String(salt)}.{hashed}";
    }
    
    public bool VerifyPassword(string password, string? storedHash)
    {
        if (string.IsNullOrWhiteSpace(storedHash))
            return false;
        
        var parts = storedHash.Split('.');
        if (parts.Length != 2)
            return false;
        
        var salt = Convert.FromBase64String(parts[0]);
        var hash = parts[1];
        
        string hashed = Convert.ToBase64String(KeyDerivation.Pbkdf2(
            password: password,
            salt: salt,
            prf: KeyDerivationPrf.HMACSHA256,
            iterationCount: 100000,
            numBytesRequested: 256 / 8));
        
        return hash == hashed;
    }
}
