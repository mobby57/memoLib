using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;

namespace MemoLib.Api.Services;

public class VaultService
{
    private readonly MemoLibDbContext _context;
    private readonly string _masterKey;

    public VaultService(MemoLibDbContext context, IConfiguration config)
    {
        _context = context;
        _masterKey = config["Vault:MasterKey"] ?? GenerateMasterKey();
    }

    private string GenerateMasterKey()
    {
        var key = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        Console.WriteLine($"⚠️ MASTER KEY GÉNÉRÉ: {key}");
        Console.WriteLine("⚠️ SAUVEGARDEZ-LE dans appsettings.json sous Vault:MasterKey");
        return key;
    }

    public async Task<string> StoreSecretAsync(Guid userId, string key, string value, string category = "General")
    {
        var encrypted = Encrypt(value);
        
        var existing = await _context.SecretVaults
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Key == key);

        if (existing != null)
        {
            existing.EncryptedValue = encrypted;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _context.SecretVaults.Add(new SecretVault
            {
                UserId = userId,
                Key = key,
                EncryptedValue = encrypted,
                Category = category
            });
        }

        await _context.SaveChangesAsync();
        return "✅ Secret stocké avec succès";
    }

    public async Task<string?> GetSecretAsync(Guid userId, string key)
    {
        var secret = await _context.SecretVaults
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Key == key);

        return secret != null ? Decrypt(secret.EncryptedValue) : null;
    }

    public async Task<string?> GetSecretGlobalAsync(string key)
    {
        var secret = await _context.SecretVaults
            .FirstOrDefaultAsync(s => s.Key == key);

        return secret != null ? Decrypt(secret.EncryptedValue) : null;
    }

    public async Task<List<SecretVault>> ListSecretsAsync(Guid userId)
    {
        return await _context.SecretVaults
            .Where(s => s.UserId == userId)
            .Select(s => new SecretVault
            {
                Id = s.Id,
                Key = s.Key,
                Category = s.Category,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt,
                EncryptedValue = "***" // Masqué
            })
            .ToListAsync();
    }

    public async Task<bool> DeleteSecretAsync(Guid userId, string key)
    {
        var secret = await _context.SecretVaults
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Key == key);

        if (secret == null) return false;

        _context.SecretVaults.Remove(secret);
        await _context.SaveChangesAsync();
        return true;
    }

    private string Encrypt(string plainText)
    {
        using var aes = Aes.Create();
        aes.Key = Convert.FromBase64String(_masterKey);
        aes.GenerateIV();

        using var encryptor = aes.CreateEncryptor();
        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var encrypted = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

        var result = new byte[aes.IV.Length + encrypted.Length];
        Buffer.BlockCopy(aes.IV, 0, result, 0, aes.IV.Length);
        Buffer.BlockCopy(encrypted, 0, result, aes.IV.Length, encrypted.Length);

        return Convert.ToBase64String(result);
    }

    private string Decrypt(string cipherText)
    {
        var fullCipher = Convert.FromBase64String(cipherText);

        using var aes = Aes.Create();
        aes.Key = Convert.FromBase64String(_masterKey);

        var iv = new byte[aes.IV.Length];
        var cipher = new byte[fullCipher.Length - iv.Length];

        Buffer.BlockCopy(fullCipher, 0, iv, 0, iv.Length);
        Buffer.BlockCopy(fullCipher, iv.Length, cipher, 0, cipher.Length);

        aes.IV = iv;

        using var decryptor = aes.CreateDecryptor();
        var decrypted = decryptor.TransformFinalBlock(cipher, 0, cipher.Length);

        return Encoding.UTF8.GetString(decrypted);
    }
}
