$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Start()
Write-Host "Listening on http://127.0.0.1:$port/"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $requestUrl = $context.Request.Url.LocalPath
        if ($requestUrl -eq '/') { $requestUrl = '/index.html' }
        
        # Replace forward slashes with backslashes for Windows path
        $requestUrl = $requestUrl -replace '/', '\'
        $filePath = Join-Path -Path $PWD -ChildPath $requestUrl
        
        $response = $context.Response
        
        if (Test-Path -Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            if ($ext -eq '.html') { $response.ContentType = 'text/html' }
            elseif ($ext -eq '.css') { $response.ContentType = 'text/css' }
            elseif ($ext -eq '.js') { $response.ContentType = 'application/javascript' }
            elseif ($ext -eq '.png') { $response.ContentType = 'image/png' }
            elseif ($ext -eq '.jpg' -or $ext -eq '.jpeg') { $response.ContentType = 'image/jpeg' }
            elseif ($ext -eq '.webp') { $response.ContentType = 'image/webp' }
            
            # Read and write content
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
}
