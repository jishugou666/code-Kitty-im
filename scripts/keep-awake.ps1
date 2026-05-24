Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Power {
    [DllImport("kernel32.dll")]
    public static extern uint SetThreadExecutionState(uint f);
    public const uint CONT = 0x80000000;
    public const uint SYS = 0x00000001;
    public const uint DISP = 0x00000002;
}
"@ -ErrorAction SilentlyContinue

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       Keep Awake v1.0" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Status: RUNNING | Screen will NOT turn off" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Red
Write-Host ""

$flags = [Power]::CONT -bor [Power]::SYS -bor [Power]::DISP
[Power]::SetThreadExecutionState($flags) | Out-Null

$n = 0
while ($true) {
    [Power]::SetThreadExecutionState($flags) | Out-Null
    $n++
    Write-Host ("[{0}] refresh #{1} - keep awake" -f (Get-Date -Format "HH:mm:ss"), $n) -ForegroundColor Gray
    Start-Sleep -Seconds 30
}
