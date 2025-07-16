import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ComponentAnalysis {
  name: string;
  description: string;
  specifications: string;
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const frontImage = formData.get('frontImage') as File;
    const backImage = formData.get('backImage') as File;

    if (!frontImage || !backImage) {
      return new Response(
        JSON.stringify({ error: 'Both front and back images are required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate image files
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(frontImage.type) || !allowedTypes.includes(backImage.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid image format. Please upload JPEG, PNG, or WebP images.' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check for corrupted images by attempting to read them
    try {
      const frontBytes = await frontImage.arrayBuffer();
      const backBytes = await backImage.arrayBuffer();

      if (frontBytes.byteLength === 0 || backBytes.byteLength === 0) {
        throw new Error('Empty image file detected');
      }
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'One or more images appear to be corrupted' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert images to base64
    const frontBuffer = Buffer.from(await frontImage.arrayBuffer());
    const backBuffer = Buffer.from(await backImage.arrayBuffer());

    const frontImagePart = {
      inlineData: {
        data: frontBuffer.toString('base64'),
        mimeType: frontImage.type,
      },
    };

    const backImagePart = {
      inlineData: {
        data: backBuffer.toString('base64'),
        mimeType: backImage.type,
      },
    };

    const prompt = `
    Analyze these two images (front and back views) of a lab component or library item. 
    Identify the component and provide detailed information based on both images.
    
    Return ONLY a JSON object in this exact format:
    {
        "name": "Concise component name with model/type (e.g., 'Arduino Uno R3', 'LED Strip RGB', 'Resistor 220Ω')",
        "description": "Complete description in EXACTLY 250 characters or less, including its purpose, key features, and functionality. Must end with complete sentences.",
        "specifications": "Complete technical specifications in EXACTLY 250 characters or less, including dimensions, materials, ratings, interfaces. Must end with complete sentences."
    }
    
    CRITICAL REQUIREMENTS:
    - Name must be concise and specific (include model/type/rating when visible)
    - Description must be EXACTLY 250 characters OR LESS - count every character carefully
    - Specifications must be EXACTLY 250 characters OR LESS - count every character carefully
    - NEVER exceed 250 characters for description or specifications
    - Always end with complete sentences, never cut off mid-sentence
    - Use information from both front and back images
    - Be precise and technical but stay within character limits
    `;

    try {
      const result = await model.generateContent([prompt, frontImagePart, backImagePart]);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response
      let parsedResult: ComponentAnalysis;
      try {
        if (text.includes('```json')) {
          const jsonStart = text.indexOf('```json') + 7;
          const jsonEnd = text.indexOf('```', jsonStart);
          const jsonText = text.substring(jsonStart, jsonEnd).trim();
          parsedResult = JSON.parse(jsonText);
        } else if (text.includes('{') && text.includes('}')) {
          const jsonStart = text.indexOf('{');
          const jsonEnd = text.lastIndexOf('}') + 1;
          const jsonText = text.substring(jsonStart, jsonEnd);
          parsedResult = JSON.parse(jsonText);
        } else {
          parsedResult = {
            name: 'Unknown Component',
            description: 'Unable to analyze the images automatically. Please provide a manual description.',
            specifications: 'Unable to determine specifications from the images. Please add manually.'
          };
        }
      } catch (parseError) {
        parsedResult = {
          name: 'Unknown Component',
          description: 'Error parsing AI response. Please provide a manual description.',
          specifications: 'Error parsing AI response. Please add specifications manually.'
        };
      }

      // Validate that AI followed character limits (fallback only if needed)
      if (parsedResult.description.length > 250) {
        console.warn('AI exceeded description character limit:', parsedResult.description.length);
        // Find the last complete sentence within limit
        const truncated = parsedResult.description.substring(0, 250);
        const lastPeriod = truncated.lastIndexOf('.');
        const lastExclamation = truncated.lastIndexOf('!');
        const lastQuestion = truncated.lastIndexOf('?');
        const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
        
        if (lastSentenceEnd > 0) {
          parsedResult.description = parsedResult.description.substring(0, lastSentenceEnd + 1);
        } else {
          parsedResult.description = parsedResult.description.substring(0, 247) + '...';
        }
      }
      
      if (parsedResult.specifications.length > 250) {
        console.warn('AI exceeded specifications character limit:', parsedResult.specifications.length);
        // Find the last complete sentence within limit
        const truncated = parsedResult.specifications.substring(0, 250);
        const lastPeriod = truncated.lastIndexOf('.');
        const lastExclamation = truncated.lastIndexOf('!');
        const lastQuestion = truncated.lastIndexOf('?');
        const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
        
        if (lastSentenceEnd > 0) {
          parsedResult.specifications = parsedResult.specifications.substring(0, lastSentenceEnd + 1);
        } else {
          parsedResult.specifications = parsedResult.specifications.substring(0, 247) + '...';
        }
      }

      return new Response(JSON.stringify({
        status: 'success',
        result: parsedResult,
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
        },
      });

    } catch (error) {
      console.error('AI Analysis Error:', error);
      const errorResult = {
        name: 'Unknown Component',
        description: 'AI analysis failed. Please provide a manual description of the component.',
        specifications: 'AI analysis failed. Please add technical specifications manually.'
      };

      return new Response(JSON.stringify({
        status: 'error',
        result: errorResult,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

  } catch (error) {
    console.error('Route Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}