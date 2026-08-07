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

  // API Route: AI Soil Analysis via Gemini
  app.post('/api/ai-soil-analysis', async (req, res) => {
    try {
      const { areaM2, depthM, soilType, plantCategory, customNotes } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Return default structured response if key is missing
        return res.json({
          summaryAr: `بناءً على مساحة ${areaM2} م² وعمق ${depthM} م، يحتاج الموقع إلى خلطة تربة غنية جيدة الصرف ومناسبة لـ (${plantCategory}).`,
          soilPreparationStepsAr: [
            'تنظيف الموقع من الحجارة والأعشاب الضارة.',
            'خلط 70% تربة زراعية خفيفة مع 20% بيتموس و10% سماد عضوي معالج.',
            'تسوية السطح ورش الماء الخفيف لترسيب الهواء من الحفرة قبل الزراعة.',
          ],
          recommendedAdditivesAr: [
            'سماد عضوي معالج حرارياً خالي من بذور النجيل.',
            'مادة البيتموس (Peat Moss) لحفظ الرطوبة.',
            'بيرلايت (Perlite) تحسين التهوية والصرف.',
          ],
          fertilizerTipsAr: 'يرجى الري الخفيف مرتين يومياً خلال الأسبوع الأول ثم الاعتماد على جدول الري حسب الموسم.',
          estimatedBagCount50L: Math.ceil(((areaM2 * depthM) * 1000) / 50),
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `أنت خبير هندسة حدائق وتربة زراعية.
العميل يرغب بتجهيز حديقة بالمواصفات التالية:
- المساحة السطحية: ${areaM2} متر مربع
- عمق التربة المطلوب: ${depthM} متر
- نوع التربة الحالي: ${soilType}
- نوع المزروعات: ${plantCategory}
- ملاحظات إضافية: ${customNotes || 'لا يوجد'}

قدم إجابة باللغة العربية بتنسيق JSON يحتوي على الحقول التالية فقط:
{
  "summaryAr": "ملخص شامل ومختصر للتوصية",
  "soilPreparationStepsAr": ["خطوة 1", "خطوة 2", "خطوة 3"],
  "recommendedAdditivesAr": ["مكون 1", "مكون 2"],
  "fertilizerTipsAr": "نصائح الري والتسميد المبدئي",
  "estimatedBagCount50L": عدد الأكياس سعة 50 ليتر
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
      return res.json({
        summaryAr: `تم حساب التوصية للحديقة بمساحة ${req.body.areaM2 || 10} م² وعمق ${req.body.depthM || 0.2} م.`,
        soilPreparationStepsAr: [
          'تنظيف مكان الغرس ودك التربة المبدئية.',
          'إضافة التربة الزراعية بالتساوي مع دك خفيف.',
        ],
        recommendedAdditivesAr: ['سماد عضوي معالج', 'بيتموس'],
        fertilizerTipsAr: 'الري بانتظام صباحاً أو مساءً.',
        estimatedBagCount50L: Math.ceil((((req.body.areaM2 || 10) * (req.body.depthM || 0.2)) * 1000) / 50),
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
