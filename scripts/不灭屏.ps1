Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class PowerAPI {
    [DllImport("kernel32.dll")]
    public static extern uint SetThreadExecutionState(uint f);
    public const uint CONT = 0x80000000;
    public const uint SYS  = 0x00000001;
    public const uint DISP = 0x00000002;
}
"@ -ErrorAction SilentlyContinue

$script:isRunning = $false
$script:refreshCount = 0
$script:startTime = $null
$script:timer = $null
$countdownTimer = $null
$script:countdownSec = 30

$form = New-Object System.Windows.Forms.Form
$form.Text = "Keep Awake v2.0"
$form.Size = New-Object System.Drawing.Size(420, 520)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.BackColor = [System.Drawing.Color]::FromArgb(30, 30, 35)
$form.Font = New-Object System.Drawing.Font("Segoe UI", 9)

$headerPanel = New-Object System.Windows.Forms.Panel
$headerPanel.Dock = "Top"
$headerPanel.Height = 60
$headerPanel.BackColor = [System.Drawing.Color]::FromArgb(45, 45, 50)
$headerPanel.Padding = New-Object System.Windows.Forms.Padding(20, 0, 0, 0)
$form.Controls.Add($headerPanel)

$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = "Keep Awake"
$titleLabel.ForeColor = [System.Drawing.Color]::White
$titleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
$titleLabel.Location = New-Object System.Drawing.Point(0, 8)
$titleLabel.AutoSize = $true
$headerPanel.Controls.Add($titleLabel)

$subTitleLabel = New-Object System.Windows.Forms.Label
$subTitleLabel.Text = "Screen & Sleep Prevention Tool"
$subTitleLabel.ForeColor = [System.Drawing.Color]::FromArgb(140, 140, 145)
$subTitleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$subTitleLabel.Location = New-Object System.Drawing.Point(0, 34)
$subTitleLabel.AutoSize = $true
$headerPanel.Controls.Add($subTitleLabel)

$statusCard = New-Object System.Windows.Forms.Panel
$statusCard.Location = New-Object System.Drawing.Point(20, 75)
$statusCard.Size = New-Object System.Drawing.Size(364, 100)
$statusCard.BackColor = [System.Drawing.Color]::FromArgb(40, 40, 45)
$form.Controls.Add($statusCard)

$statusDot = New-Object System.Windows.Forms.Panel
$statusDot.Location = New-Object System.Drawing.Point(132, 18)
$statusDot.Size = New-Object System.Drawing.Size(16, 16)
$statusDot.BackColor = [System.Drawing.Color]::Gray
$statusCard.Controls.Add($statusDot)

$statusTextLabel = New-Object System.Windows.Forms.Label
$statusTextLabel.Text = "STOPPED"
$statusTextLabel.ForeColor = [System.Drawing.Color]::Gray
$statusTextLabel.Font = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
$statusTextLabel.Location = New-Object System.Drawing.Point(154, 12)
$statusTextLabel.AutoSize = $true
$statusCard.Controls.Add($statusTextLabel)

$statusDescLabel = New-Object System.Windows.Forms.Label
$statusDescLabel.Text = "Screen and system will sleep normally"
$statusDescLabel.ForeColor = [System.Drawing.Color]::FromArgb(120, 120, 125)
$statusDescLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$statusDescLabel.Location = New-Object System.Drawing.Point(24, 50)
$statusDescLabel.AutoSize = $true
$statusCard.Controls.Add($statusDescLabel)

$apiLabel = New-Object System.Windows.Forms.Label
$apiLabel.Text = "API: SetThreadExecutionState (kernel32.dll)"
$apiLabel.ForeColor = [System.Drawing.Color]::FromArgb(90, 90, 95)
$apiLabel.Font = New-Object System.Drawing.Font("Consolas", 8)
$apiLabel.Location = New-Object System.Drawing.Point(24, 72)
$apiLabel.AutoSize = $true
$statusCard.Controls.Add($apiLabel)

$startBtn = New-Object System.Windows.Forms.Button
$startBtn.Text = "   START   "
$startBtn.Location = New-Object System.Drawing.Point(110, 190)
$startBtn.Size = New-Object System.Drawing.Size(184, 44)
$startBtn.FlatStyle = "Flat"
$startBtn.FlatAppearance.BorderSize = 0
$startBtn.BackColor = [System.Drawing.Color]::FromArgb(52, 152, 219)
$startBtn.ForeColor = [System.Drawing.Color]::White
$startBtn.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$startBtn.Cursor = "Hand"
$form.Controls.Add($startBtn)

$dataPanel = New-Object System.Windows.Forms.Panel
$dataPanel.Location = New-Object System.Drawing.Point(20, 250)
$dataPanel.Size = New-Object System.Drawing.Size(364, 170)
$dataPanel.Name = "dataPanel"
$form.Controls.Add($dataPanel)

function CreateDataCard($labelText, $valueText, $x, $y, $w, $h) {
    $card = New-Object System.Windows.Forms.Panel
    $card.Location = New-Object System.Drawing.Point($x, $y)
    $card.Size = New-Object System.Drawing.Size($w, $h)
    $card.BackColor = [System.Drawing.Color]::FromArgb(40, 40, 45)
    
    $lbl = New-Object System.Windows.Forms.Label
    $lbl.Text = $labelText
    $lbl.ForeColor = [System.Drawing.Color]::FromArgb(130, 130, 135)
    $lbl.Font = New-Object System.Drawing.Font("Segoe UI", 9)
    $lbl.Location = New-Object System.Drawing.Point(10, 6)
    $lbl.AutoSize = $true
    $card.Controls.Add($lbl)
    
    $val = New-Object System.Windows.Forms.Label
    $val.Name = "val_" + $labelText
    $val.Text = $valueText
    $val.ForeColor = [System.Drawing.Color]::White
    $val.Font = New-Object System.Drawing.Font("Consolas", 13, [System.Drawing.FontStyle]::Bold)
    $val.Location = New-Object System.Drawing.Point(10, 28)
    $val.AutoSize = $true
    $card.Controls.Add($val)
    
    return $card
}

$elapsedCard = CreateDataCard "ELAPSED" "--:--:--" 0 0 172 70
$refreshCard = CreateDataCard "REFRESHES" "0" 182 0 162 70
$countdownCard = CreateDataCard "NEXT REFRESH" "30s" 0 85 172 70
$starttimeCard = CreateDataCard "STARTED AT" "--:--:--" 182 85 162 70

$dataPanel.Controls.Add($elapsedCard)
$dataPanel.Controls.Add($refreshCard)
$dataPanel.Controls.Add($countdownCard)
$dataPanel.Controls.Add($starttimeCard)

$progressBar = New-Object System.Windows.Forms.ProgressBar
$progressBar.Location = New-Object System.Drawing.Point(20, 435)
$progressBar.Size = New-Object System.Drawing.Size(364, 8)
$progressBar.Style = "Continuous"
$progressBar.Value = 0
$progressBar.ForeColor = [System.Drawing.Color]::FromArgb(52, 152, 219)
$form.Controls.Add($progressBar)

$footerLabel = New-Object System.Windows.Forms.Label
$footerLabel.Text = "Close window or press Alt+F4 to exit"
$footerLabel.ForeColor = [System.Drawing.Color]::FromArgb(80, 80, 85)
$footerLabel.Font = New-Object System.Drawing.Font("Segoe UI", 8)
$footerLabel.Location = New-Object System.Drawing.Point(20, 455)
$footerLabel.AutoSize = $true
$form.Controls.Add($footerLabel)

function UpdateStatusUI($running) {
    if ($running) {
        $statusDot.BackColor = [System.Drawing.Color]::FromArgb(46, 204, 113)
        $statusTextLabel.Text = "RUNNING"
        $statusTextLabel.ForeColor = [System.Drawing.Color]::FromArgb(46, 204, 113)
        $statusDescLabel.Text = "Screen stays ON, system will NOT sleep"
        $startBtn.Text = "   STOP    "
        $startBtn.BackColor = [System.Drawing.Color]::FromArgb(231, 76, 60)
        $progressBar.ForeColor = [System.Drawing.Color]::FromArgb(46, 204, 113)
    } else {
        $statusDot.BackColor = [System.Drawing.Color]::Gray
        $statusTextLabel.Text = "STOPPED"
        $statusTextLabel.ForeColor = [System.Drawing.Color]::Gray
        $statusDescLabel.Text = "Screen and system will sleep normally"
        $startBtn.Text = "   START   "
        $startBtn.BackColor = [System.Drawing.Color]::FromArgb(52, 152, 219)
        $progressBar.ForeColor = [System.Drawing.Color]::FromArgb(52, 152, 219)
    }
}

function GetElapsedTime {
    if ($null -eq $script:startTime) { return "--:--:--" }
    $span = (Get-Date) - $script:startTime
    return "{0:D2}:{1:D2}:{2:D2}" -f $span.Hours, $span.Minutes, $span.Seconds
}

function StartKeepAwake {
    $script:isRunning = $true
    $script:refreshCount = 0
    $script:startTime = Get-Date
    $script:countdownSec = 30
    
    UpdateStatusUI $true
    
    ($refreshCard.Controls | Where-Object { $_.Name -eq "val_REFRESHES" }).Text = "0"
    ($starttimeCard.Controls | Where-Object { $_.Name -eq "val_STARTED AT" }).Text = $script:startTime.ToString("HH:mm:ss")
    
    $flags = [PowerAPI]::CONT -bor [PowerAPI]::SYS -bor [PowerAPI]::DISP
    [PowerAPI]::SetThreadExecutionState($flags) | Out-Null
    
    $script:timer = New-Object System.Windows.Forms.Timer
    $script:timer.Interval = 30000
    $script:timer.Add_Tick({
        $flags = [PowerAPI]::CONT -bor [PowerAPI]::SYS -bor [PowerAPI]::DISP
        [PowerAPI]::SetThreadExecutionState($flags) | Out-Null
        $script:refreshCount++
        ($form.Controls["dataPanel"].Controls[1].Controls | Where-Object { $_.Name -eq "val_REFRESHES" }).Text = "$($script:refreshCount)"
        $script:countdownSec = 30
    })
    $script:timer.Start()
    
    $countdownTimer = New-Object System.Windows.Forms.Timer
    $countdownTimer.Interval = 1000
    $countdownTimer.Add_Tick({
        ($form.Controls["dataPanel"].Controls[0].Controls | Where-Object { $_.Name -eq "val_ELAPSED" }).Text = GetElapsedTime
        
        if ($script:isRunning) {
            $script:countdownSec--
            if ($script:countdownSec -lt 0) { $script:countdownSec = 30 }
            ($form.Controls["dataPanel"].Controls[2].Controls | Where-Object { $_.Name -eq "val_NEXT REFRESH" }).Text = "$($script:countdownSec)s"
            $pct = [int](($script:countdownSec / 30.0) * 100)
            $form.Controls["progressBar"].Value = $pct
        }
    })
    $countdownTimer.Start()
    $script:countdownTimerRef = $countdownTimer
}

function StopKeepAwake {
    $script:isRunning = $false
    UpdateStatusUI $false
    
    if ($null -ne $script:timer) {
        $script:timer.Stop()
        $script:timer.Dispose()
        $script:timer = $null
    }
    if ($null -ne $script:countdownTimerRef) {
        $script:countdownTimerRef.Stop()
        $script:countdownTimerRef.Dispose()
    }
    
    [PowerAPI]::SetThreadExecutionState([PowerAPI]::CONT) | Out-Null
    
    ($countdownCard.Controls | Where-Object { $_.Name -eq "val_NEXT REFRESH" }).Text = "--s"
    $progressBar.Value = 0
}

$startBtn.Add_Click({
    if ($script:isRunning) {
        StopKeepAwake
    } else {
        StartKeepAwake
    }
})

$form.Add_FormClosing({
    if ($script:isRunning) {
        [PowerAPI]::SetThreadExecutionState([PowerAPI]::CONT) | Out-Null
    }
})

[void]$form.ShowDialog()
