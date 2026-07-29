$connString = (Get-Content "backend\appsettings.Production.json" | ConvertFrom-Json).ConnectionStrings.DefaultConnection
$conn = New-Object Npgsql.NpgsqlConnection($connString)
$conn.Open()
$cmd = New-Object Npgsql.NpgsqlCommand("SELECT u.""Email"", u.""RoleId"", r.""RoleName"" FROM ""Users"" u LEFT JOIN ""Roles"" r ON u.""RoleId"" = r.""Id"" WHERE u.""Email"" = 'admin@ktd.com'", $conn)
$reader = $cmd.ExecuteReader()
while ($reader.Read()) {
    Write-Host ("Email: {0}, RoleId: {1}, RoleName: '{2}'" -f $reader[0], $reader[1], $reader[2])
}
$conn.Close()
