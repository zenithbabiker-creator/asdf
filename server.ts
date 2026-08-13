import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: AI Garden & Turf Analysis via Gemini
  app.post('/api/ai-soil-analysis', async (req, res) => {
    try {
      const { areaM2, seedlingsPerM2, plantCategory, customNotes } = req.body;
      const countSeedlings = (areaM2 || 20) * (seedlingsPerM2 || 10);

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Return default structured response if key is missing
        return res.json({
          summaryAr: `بناءً على مساحة الحديقة ${areaM2} م² وعدد شتول النجيلة المختارة ${seedlingsPerM2 || 10} شتلة/م²، تم إعداد التوصيات الفنية للزراعة والعدد الكلي المطلوب (${countSeedlings} شتلة).`,
          soilPreparationStepsAr: [
            'تنظيف وتسوية الأرض وإزالة الأحجار والتربة غير المستوية.',
            'فرش طبقة الرمل الزراعي الخفيف أو البيتموس بسمك مناسب قبل غرست الشتول.',
            'دك السطح وتمرير البكرات الخفيفة لضمان استواء سطح النجيلة.',
          ],
          recommendedAdditivesAr: [
            'استخدام محددات النباتات العريضة (30سم، 20سم، 10سم) للفصل بين أصناف الزهور والنجيل.',
            'توفير نظام ري بالتنقيط للمحددات وري بالرشاشات للمساحة المتبقية من النجيلة.',
          ],
          fertilizerTipsAr: 'يرجى الري الخفيف مرتين يومياً خلال الأسبوع الأول بعد غرس شتول النجيلة حتى تتجذر العروق.',
          estimatedTurfM2: areaM2,
          estimatedTotalSeedlings: countSeedlings,
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `أنت خبير هندسة حدائق وتصميم لاندسكيب.
العميل يرغب بتصميم حديقة بالمواصفات التالية:
- المساحة السطحية المتبقية للنجيلة: ${areaM2} متر مربع
- عدد شتول النجيلة في المتر المربع: ${seedlingsPerM2} شتلة/م² (العدد الكلي: ${countSeedlings} شتلة)
- نوع المزروعات والأصناف للمحددات: ${plantCategory}
- ملاحظات إضافية: ${customNotes || 'لا يوجد'}

قدم إجابة باللغة العربية بتنسيق JSON يحتوي على الحقول التالية فقط:
{
  "summaryAr": "ملخص شامل ومختصر لتنفيذ وزراعة شتول النجيلة بالحديقة",
  "soilPreparationStepsAr": ["خطوة 1", "خطوة 2", "خطوة 3"],
  "recommendedAdditivesAr": ["توصية 1", "توصية 2"],
  "fertilizerTipsAr": "نصائح الري والعناية بالنجيلة والمحددات",
  "estimatedTurfM2": المساحة المطلوبة للنجيلة,
  "estimatedTotalSeedlings": العدد الكلي لشتول النجيلة
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '';
      const parsedData = JSON.parse(responseText);
      return res.json(parsedData);
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      // Fallback response on error
      const countSeedlingsFallback = (req.body.areaM2 || 20) * (req.body.seedlingsPerM2 || 10);
      return res.json({
        summaryAr: `تم حساب التوصية للحديقة بمساحة ${req.body.areaM2 || 20} م² وعدد الشتول ${req.body.seedlingsPerM2 || 10} شتلة/م² (الإجمالي: ${countSeedlingsFallback} شتلة).`,
        soilPreparationStepsAr: [
          'تنظيف وتسوية مكان الفرد ودك الأرض المبدئية.',
          'غرس شتول النجيلة بالتساوي ورشها بالماء الخفيف.',
        ],
        recommendedAdditivesAr: ['محددات ألومنيوم/بلاستيكية لحجب أحواض الزهور', 'سماد عضوي معالج'],
        fertilizerTipsAr: 'الري بانتظام صباحاً ومساءً.',
        estimatedTurfM2: req.body.areaM2 || 20,
        estimatedTotalSeedlings: countSeedlingsFallback,
      });
    }
  });

  // Vite middleware in development or static serve in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
