$files = @{
    "Controllers\ProductsController.cs" = @{
        "\[HttpGet\]" = "[HttpGet]`n        [RequiresPermission(`"perm-7`")]"
        "\[HttpPost\]" = "[HttpPost]`n        [RequiresPermission(`"perm-8`")]"
        "\[HttpPut\(`"\{id\}/stock`"\)\]" = "[HttpPut(`"{id}/stock`")]`n        [RequiresPermission(`"perm-8`")]"
        "\[HttpGet\(`"\{id\}/stock-history`"\)\]" = "[HttpGet(`"{id}/stock-history`")]`n        [RequiresPermission(`"perm-7`")]"
    }
    "Controllers\OrdersController.cs" = @{
        "\[HttpGet\]" = "[HttpGet]`n        [RequiresPermission(`"perm-5`")]"
        "\[HttpPost\]" = "[HttpPost]`n        [RequiresPermission(`"perm-6`")]"
        "\[HttpPatch\(`"\{id\}/status`"\)\]" = "[HttpPatch(`"{id}/status`")]`n        [RequiresPermission(`"perm-6`")]"
        "\[HttpDelete\(`"\{id\}`"\)\]" = "[HttpDelete(`"{id}`")]`n        [RequiresPermission(`"perm-6`")]"
    }
    "Controllers\FinanceController.cs" = @{
        "\[HttpGet\]" = "[HttpGet]`n        [RequiresPermission(`"perm-1`")]"
        "\[HttpGet\(`"dashboard`"\)\]" = "[HttpGet(`"dashboard`")]`n        [RequiresPermission(`"perm-1`")]"
        "\[HttpGet\(`"margin-details`"\)\]" = "[HttpGet(`"margin-details`")]`n        [RequiresPermission(`"perm-1`")]"
    }
    "Controllers\UsersController.cs" = @{
        "\[HttpGet\]" = "[HttpGet]`n        [RequiresPermission(`"perm-3`")]"
        "\[HttpPost\]" = "[HttpPost]`n        [RequiresPermission(`"perm-4`")]"
        "\[HttpPut\(`"\{id\}`"\)\]" = "[HttpPut(`"{id}`")]`n        [RequiresPermission(`"perm-4`")]"
        "\[HttpDelete\(`"\{id\}`"\)\]" = "[HttpDelete(`"{id}`")]`n        [RequiresPermission(`"perm-4`")]"
    }
}

foreach ($file in $files.Keys) {
    $content = Get-Content $file -Raw
    # Add using techretail_api.Attributes if not present
    if ($content -notmatch "using techretail_api.Attributes;") {
        $content = "using techretail_api.Attributes;`n" + $content
    }
    
    foreach ($pattern in $files[$file].Keys) {
        $replacement = $files[$file][$pattern]
        $content = [regex]::Replace($content, $pattern, $replacement)
    }
    Set-Content -Path $file -Value $content
}
