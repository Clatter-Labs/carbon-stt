# Carbon /STT

<p align="center"><img src="assets/carbon-logo.svg" width="96" alt="Carbon logo"></p>

**Carbon** هو runtime خفيف وسريع لتحويل الكلام إلى نص في الويب، من إنشاء **Clatter Labs Software** داخل منظمة **Clatter-Labs**. يعالج الصوت محليًا داخل المتصفح، ويستخدم WebGPU عند توفره مع بديل WASM للأجهزة الأخرى.

> **الحالة:** Carbon v0.1 منتج تشغيل وتجربة يعمل فعليًا. هو مبني من Clatter Labs فوق بنية وأوزان Whisper المفتوحة، وليس ادعاءً بأن Clatter Labs أنشأت نموذج Whisper الأصلي. الخطوة التالية هي تدريب/تقطير checkpoint مستقل باسم Carbon.

## ما هو Whisper؟

Whisper هو نموذج Transformer للتعرّف التلقائي على الكلام (ASR) والترجمة الكلامية، طورته OpenAI ونشرت كوده وأوزانه بترخيص MIT. هو نموذج encoder-decoder يتلقى الصوت ويولّد tokens تمثل النص. درّبت OpenAI عائلة Whisper على نحو 680 ألف ساعة من بيانات كلام معلمة أو ضعيفة الإشراف، وتضم النماذج متعددة اللغات العربية والإنجليزية ولغات كثيرة أخرى.

إذًا العلاقة الصحيحة هي:

- **OpenAI** أنشأت نموذج Whisper الأصلي ووفرت أوزانه.
- **Clatter Labs Software** أنشأت Carbon كمنتج/runtime مستقل للويب، ودمجت أوزانًا متوافقة، وصممت تجربة التشغيل والواجهة، وتملك مسار تطوير Carbon الخاص بها.
- **Carbon checkpoint الأصلي** سيأتي لاحقًا بعد اختيار بيانات مرخصة وتدريب أو distillation وتقييم مستقل.

## اللغات

الإصدار الحالي يستخدم `onnx-community/whisper-tiny` متعدد اللغات، وليس النسخة الإنجليزية فقط. الواجهة تتيح الكشف التلقائي عن اللغة، والعربية، والإنجليزية، والفرنسية، والإسبانية، والهندية، والبرتغالية، والألمانية، والتركية.

كما أن Whisper متعدد اللغات يغطي لغات أخرى، لكن الدقة ليست متساوية بينها؛ تعتمد على كمية وجودة البيانات المتاحة لكل لغة، واللهجة، وضوضاء التسجيل. العربية والإنجليزية مدعومتان في Carbon من خلال checkpoint متعدد اللغات، مع إمكانية تثبيت اللغة يدويًا لتحسين النتيجة عندما تكون معروفة.

## كيف يعمل Carbon؟

- **مسار سريع:** WebGPU مع fp16 عندما يوفّر المتصفح `navigator.gpu`.
- **مسار محمول:** ONNX Runtime WASM مع q8 عندما لا يتوفر WebGPU.
- **خصوصية افتراضية:** الصوت لا يذهب إلى backend؛ يتم تحميل ملفات النموذج من Hugging Face عند أول استخدام ثم تخزينها في browser cache.
- **واجهة بسيطة:** تسجيل من الميكروفون أو رفع ملف صوتي/فيديو ثم نسخ النص.
- **أوزان قابلة للاستبدال:** يمكن استبدال معرف النموذج في `src/main.js` بـ Carbon checkpoint متوافق مستقبلًا.

## التشغيل محليًا

```bash
npm install
npm run dev
```

افتح الرابط الذي يعرضه Vite. تسجيل الميكروفون يحتاج إلى secure context؛ `localhost` مسموح به من المتصفحات.

```bash
npm test
npm run build
```

## الترخيص والمصادر

كود Carbon والواجهة في هذا المستودع مرخصان MIT من Clatter Labs Software. أوزان Whisper الأصلية والكود upstream مرخصان MIT من OpenAI. تحويل ONNX المستخدم في المتصفح منشور في مستودع `onnx-community/whisper-tiny`. راجع شروط المستودعات الأصلية قبل إعادة توزيع الأوزان في منتج تجاري.

- [Transformers.js](https://huggingface.co/docs/transformers.js/en/index)
- [Transformers.js WebGPU ASR example](https://github.com/huggingface/blog/blob/main/transformersjs-v3.md)
- [OpenAI Whisper repository](https://github.com/openai/whisper)
- [Whisper model card](https://huggingface.co/openai/whisper-tiny)
- [Browser reference project](https://github.com/xenova/whisper-web)

## خارطة الطريق إلى Carbon checkpoint مستقل

1. تثبيت اللغات المستهدفة، latency، وWER المطلوب على أجهزة الويب.
2. بناء benchmark عربي/إنجليزي متوازن مع تسجيلات ولهجات وضوضاء واقعية.
3. اختيار corpus مرخص وقابل لإعادة التوزيع، مع موافقة المتحدثين عند الحاجة.
4. إجراء distillation أو fine-tuning لنموذج طالب أقل من 30M parameter بدل تدريب نموذج ضخم.
5. تصدير checkpoint إلى ONNX، ثم quantization إلى q8/q4، واختبار WebGPU/WASM.
6. نشر `Clatter-Labs/carbon-model` أو مستودع أوزان منفصل مع model card وWER وcommit hashes.
7. تغيير `MODEL` إلى Carbon checkpoint مع إبقاء واجهة Carbon نفسها.

## حدود مهمة

هذا الإصدار ليس نظامًا مناسبًا لاتخاذ قرارات طبية أو قانونية أو وظيفية دون مراجعة بشرية. نماذج Whisper قد تخطئ أو تهلوس أو تختلف دقتها حسب اللغة واللهجة وجودة التسجيل. لا تسجل أو تفرغ كلام الأشخاص دون موافقتهم.

## المنظمة

Maintained by **Clatter Labs Software** داخل منظمة **Clatter-Labs** على GitHub. Carbon ليس منتجًا رسميًا تابعًا لـ OpenAI أو Hugging Face؛ هو مشروع Clatter Labs مبني على تقنيات وأوزان مفتوحة مع نسبها إلى أصحابها.

## الاستضافة المحلية والخوادم

يوفر Carbon الآن خادمًا محليًا متوافقًا مع نمط OpenAI للتفريغ الصوتي، لذلك يمكن تشغيله على Docker أو على أي بيئة CLI تشغّل Python. لا يحتاج المتصفح إلى الوصول إلى Ollama أو LM Studio مباشرة؛ يمكنه استدعاء Carbon API الخاص بنا.

### Docker

```bash
./deploy/carbonctl.sh up
./deploy/carbonctl.sh health
curl -X POST http://localhost:8000/v1/audio/transcriptions \\
  -F file=@sample.wav \\
  -F language=ar
```

يستخدم الخادم `faster-whisper` مع نموذج Whisper متعدد اللغات، ويحفظ cache النموذج في volume دائم. الإعداد الافتراضي CPU/int8؛ للسيرفر الذي يملك CUDA يمكن ضبط `CARBON_DEVICE=cuda` و`CARBON_COMPUTE_TYPE=float16` بعد استخدام صورة CUDA مناسبة.

### CLI مباشر

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r server/requirements.txt
python -m server.cli recording.wav --language ar
python -m server.cli recording.wav --language en --json
```

### Ollama وLM Studio

Ollama وLM Studio مفيدان كطبقة **LLM نصية اختيارية** بعد التفريغ: يرسل Carbon النص الناتج إليهما للتلخيص أو التنظيف أو استخراج البيانات. لا نعلن أنهما بديلان أصليان لخادم ASR؛ توثيق LM Studio يركز على chat/responses/embeddings، بينما خادم Carbon هو المسؤول عن audio transcription. يمكن تشغيل Ollama أو LM Studio بجانب Carbon عند الحاجة، مع إبقاء الصوت داخل بيئة المستخدم.

### أي CLI server

العقد الثابت هو endpoint التالي:

```text
POST /v1/audio/transcriptions
multipart/form-data: file, language?, prompt?, response_format?
```

بهذا يمكن وضع Carbon خلف Nginx أو Caddy أو systemd أو Kubernetes أو أي process manager، من دون ربط الواجهة بمزود واحد.
