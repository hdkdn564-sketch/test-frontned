$content = Get-Content "b:\Project\shareeha-athmal\frontend\app\components\CustomerReviews.tsx" -Raw -Encoding UTF8

# إصلاح النصوص العربية
$content = $content -replace 'ط¢ط±ط§ط، ط§ظ„ط¹ظ…ظ„ط§ط،', 'آراء العملاء'
$content = $content -replace 'ظ…ط§ط°ط§ ظٹظ‚ظˆظ„ظˆظ† ط¹ظ†ظ'ط§طں', 'ماذا يقولون عنّا؟'
$content = $content -replace 'طھظ‚ظٹظٹظ…', 'تقييم'
$content = $content -replace 'ظ„ط§ طھظˆط¬ط¯ ط¢ط±ط§ط، ط¨ط¹ط¯', 'لا توجد آراء بعد'
$content = $content -replace 'طھظ… ط¥ط±ط³ط§ظ„ طھط¹ظ„ظٹظ‚ظƒ ظˆط³ظٹط¸ظ‡ط± ط¨ط¹ط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©', 'تم إرسال تعليقك وسيظهر بعد المراجعة'
$content = $content -replace 'ط¥ظ„ط؛ط§ط،', 'إلغاء'
$content = $content -replace 'ط´ط§ط±ظƒ طھط¬ط±ط¨طھظƒ', 'شارك تجربتك'
$content = $content -replace 'ط§ط³ظ…ظƒ', 'اسمك'
$content = $content -replace 'ط§ظƒطھط¨ طھط¬ط±ط¨طھظƒ\.\.\.', 'اكتب تجربتك...'
$content = $content -replace 'طھظ‚ظٹظٹظ…ظƒ:', 'تقييمك:'
$content = $content -replace 'ط¬ط§ط±ظٹ ط§ظ„ط¥ط±ط³ط§ظ„\.\.\.', 'جاري الإرسال...'
$content = $content -replace 'ط¥ط±ط³ط§ظ„', 'إرسال'

[System.IO.File]::WriteAllText("b:\Project\shareeha-athmal\frontend\app\components\CustomerReviews.tsx", $content, [System.Text.UTF8Encoding]::new($false))

# إصلاح HomeCategorySections
$content2 = Get-Content "b:\Project\shareeha-athmal\frontend\app\components\HomeCategorySections.tsx" -Raw -Encoding UTF8
$content2 = $content2 -replace 'ط£ظپط¶ظ„ ط§ظ„ظ…ظ†طھط¬ط§طھ ظپظٹ ظ‡ط°ظ‡ ط§ظ„ظپط¦ط©', 'أفضل المنتجات في هذه الفئة'
$content2 = $content2 -replace 'ط¹ط±ط¶ ط§ظ„ظƒظ„', 'عرض الكل'
[System.IO.File]::WriteAllText("b:\Project\shareeha-athmal\frontend\app\components\HomeCategorySections.tsx", $content2, [System.Text.UTF8Encoding]::new($false))

Write-Host "تم إصلاح الترميز بنجاح!" -ForegroundColor Green
