using Microsoft.Data.SqlClient;

namespace CampusEvents.Backend;

public class RegistrationService
{
    private readonly string _connectionString;

    // Connection string is injected (e.g., from user-secrets or an environment variable),
    // never hard-coded in source.
    public RegistrationService(string connectionString)
    {
        _connectionString = connectionString
            ?? throw new ArgumentNullException(nameof(connectionString));
    }

    /// <summary>
    /// Returns the registration id for the given email, or null if none exists.
    /// Fixes: (1) SQL injection via string concatenation -> parameterized query,
    ///        (2) leaked SqlConnection/SqlCommand -> using statements,
    ///        (3) NullReferenceException on ExecuteScalar() with no rows -> null check.
    /// </summary>
    public string? GetUserRegistration(string inputEmail)
    {
        if (string.IsNullOrWhiteSpace(inputEmail))
            throw new ArgumentException("Email is required.", nameof(inputEmail));

        const string sql =
            "SELECT TOP (1) RegistrationId FROM dbo.Registrations r " +
            "JOIN dbo.Users u ON u.UserId = r.UserId " +
            "WHERE u.Email = @Email";

        using (var conn = new SqlConnection(_connectionString))
        using (var cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.Add("@Email", System.Data.SqlDbType.NVarChar, 254).Value = inputEmail.Trim();
            conn.Open();
            object? result = cmd.ExecuteScalar();
            return result?.ToString();
        }
    }
}
