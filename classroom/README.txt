PC Assembly Lab - وضع القاعة / Classroom mode
================================================

على حاسوب الأستاذ (يحتاج Python 3 من python.org):
  1. انقر مرتين على start-class.bat. تفتح لوحة الأستاذ في المتصفح (http://localhost:8080/teacher).
  2. أول مرة يسأل Windows عن جدار الحماية: اسمح لـ Python على الشبكات الخاصة (Private).
  3. النافذة السوداء تكتب العنوان الذي يفتحه الطلاب، مثلا http://192.168.1.10:8080
     ضعه كاختصار أو مفضلة على حواسيب الطلاب. أغلق النافذة السوداء لإنهاء الحصة.

على حواسيب الطلاب: لا شيء يُثبَّت. يفتح الطالب العنوان، يكتب اسمه ولقبه، ويتبع ما يحدده الأستاذ.
خارج القاعة (الموقع على الإنترنت، أو index.html من الملف) يعمل التطبيق كالمعتاد بلا أستاذ.

On the teacher's PC (needs Python 3 from python.org):
  1. Double-click start-class.bat. The teacher's panel opens in the browser (http://localhost:8080/teacher).
  2. The first time, Windows asks about the firewall: allow Python on Private networks.
  3. The black window shows the address students open, e.g. http://192.168.1.10:8080
     Close the black window to end the class.

Students' PCs install nothing: they open that address, type their name and follow the teacher.
Anywhere else (the live site, index.html opened from a file) the app runs as usual, with no teacher.
