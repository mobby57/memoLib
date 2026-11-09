$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open("C:\Users\moros\Desktop\reponse ccs\MEMOIRE_RECOURS_CONSEIL_ARBITRAL.docx")
$text = $doc.Content.Text
$doc.Close()
$word.Quit()
$text | Out-File "C:\Users\moros\Desktop\reponse ccs\MEMOIRE_EXTRACT.txt" -Encoding UTF8
