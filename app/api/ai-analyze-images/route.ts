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
    const itemType = formData.get('itemType') as string; // 'lab' or 'library'

    if (!frontImage || !backImage) {
      return new Response(
        JSON.stringify({ error: 'Both front and back images are required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!itemType || !['lab', 'library'].includes(itemType)) {
      return new Response(
        JSON.stringify({ error: 'Item type (lab or library) is required' }), 
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

    // Generate different prompts based on item type
    const getPrompt = (type: string) => {
      if (type === 'lab') {
        return `
        Analyze these two images (front and back views) of a LAB COMPONENT/ELECTRONIC DEVICE ONLY.
        This should be electronic components, sensors, microcontrollers, circuits, or lab equipment.
        
        VALIDATION: If these images show books, library items, or non-electronic items, return an error.
        
        Return ONLY a JSON object in this exact format:
        {
            "name": "Concise component name with model/type (e.g., 'Arduino Uno R3', 'LED Strip RGB', 'Resistor 220Ω')",
            "description": "Brief description of purpose, key features, and functionality in 200-250 characters. Must be 3-4 complete meaningful sentences.",
            "specifications": "Dimensions: 34mm x 26mm|Operating Voltage: 3.3V|Current Rating: 500mA|Material: FR4 PCB|Interface: USB Type-B|Package Type: Through-hole|Temperature Range: -10°C to +70°C|Power Consumption: 20mA"
        }
        
        CRITICAL REQUIREMENTS:
        - Only analyze electronic/lab components, NOT books or library items
        - If images show books/library items, return: {"error": "Invalid item type. Expected lab component but found library item."}
        - Name must be concise and specific (include model/type/rating when visible)
        - Description must be 200-250 characters and contain exactly 3-4 complete, meaningful sentences
        - Description should be concise yet informative, covering purpose, key features, and functionality
        - Each sentence should be short and clear, ending with proper punctuation
        - Avoid overly technical jargon; focus on practical use and benefits
        - Specifications MUST include AT LEAST 8 attributes with VALUES separated by | symbol
        - ALWAYS include these core attributes with values: Dimensions, Operating Voltage, Current Rating, Material, Interface, Package Type, Temperature Range, Power Consumption
        - Add additional relevant specs like: Microcontroller, Clock Speed, Temperature Range, Power Consumption, etc.
        - MANDATORY: Always provide values in "Attribute: Value" format (e.g., "Dimensions: 34mm x 26mm|Operating Voltage: 3.3V")
        - If specific values are visible on the component, use them exactly
        - If values aren't visible, provide reasonable typical values for that type of component
        - Never return just attribute names without values
        - Use information from both front and back images
        - Be precise and technical
        `;
      } else {
        return `
        Analyze these two images (front and back views) of a LIBRARY BOOK/PUBLICATION ONLY.
        This should be books, textbooks, manuals, or printed publications.
        
        VALIDATION: If these images show electronic components, lab equipment, or non-book items, return an error.
        
        Return ONLY a JSON object in this exact format:
        {
            "name": "Complete book title exactly as shown",
            "description": "Brief description of subject matter, target audience, and key topics in 200-250 characters. Must be 3-4 complete meaningful sentences.",
            "specifications": "Author: John Smith|Publisher: Tech Books|Edition: 3rd Edition|ISBN: 978-1234567890|Pages: 450|Publication Year: 2023|Language: English|Binding Type: Paperback|Subject Category: Computer Science|Target Level: Undergraduate"
        }
        
        CRITICAL REQUIREMENTS:
        - Only analyze books/publications, NOT electronic components or lab equipment
        - If images show electronic components/lab items, return: {"error": "Invalid item type. Expected library book but found lab component."}
        - Name must be the exact book title as shown
        - Description must be 200-250 characters and contain exactly 3-4 complete, meaningful sentences
        - Description should be concise yet informative, covering subject matter, target audience, and key topics
        - Each sentence should be short and clear, ending with proper punctuation
        - Avoid overly academic language; focus on practical content and relevance
        - Specifications MUST include AT LEAST 8 attributes with VALUES separated by | symbol
        - ALWAYS include these core attributes with values: Author, Publisher, Edition, ISBN, Pages, Publication Year, Language, Binding Type
        - Add additional relevant specs like: Language, Binding Type, Subject Category, Target Level, etc.
        - MANDATORY: Always provide values in "Attribute: Value" format (e.g., "Author: John Smith|Publisher: Tech Books")
        - If specific values are visible on the book, use them exactly
        - If values aren't visible, provide reasonable estimates or "Unknown" for that attribute
        - Never return just attribute names without values
        - Use information from both front and back images (back cover, ISBN, etc.)
        - Be precise and detailed
        `;
      }
    };
    
    const prompt = getPrompt(itemType);

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
          const fallbackName = itemType === 'lab' ? 'Unknown Component' : 'Unknown Book';
          const fallbackDesc = itemType === 'lab' 
            ? 'Unable to analyze the component images automatically. Please provide a manual description with purpose, features, and functionality details.'
            : 'Unable to analyze the book images automatically. Please provide a manual description with subject matter, target audience, and key topics.';
          parsedResult = {
            name: fallbackName,
            description: fallbackDesc,
            specifications: 'Unable to determine specifications from the images. Please add manually.'
          };
        }
        
        // Check if AI returned an error for wrong item type
        if ('error' in parsedResult) {
          return new Response(
            JSON.stringify({ 
              status: 'error',
              error: parsedResult.error,
              timestamp: new Date().toISOString()
            }), 
            { 
              status: 400, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        }
        
      } catch (parseError) {
        const fallbackName = itemType === 'lab' ? 'Unknown Component' : 'Unknown Book';
        const fallbackDesc = itemType === 'lab' 
          ? 'Error parsing AI response. Please provide a manual description with purpose, features, and functionality details.'
          : 'Error parsing AI response. Please provide a manual description with subject matter, target audience, and key topics.';
        parsedResult = {
          name: fallbackName,
          description: fallbackDesc,
          specifications: 'Error parsing AI response. Please add specifications manually.'
        };
      }

      // Validate and truncate description to 250 characters max
      if (parsedResult.description && parsedResult.description.length > 250) {
        // Find the last complete sentence within 250 characters
        const truncated = parsedResult.description.substring(0, 250);
        const lastPeriod = truncated.lastIndexOf('.');
        const lastExclamation = truncated.lastIndexOf('!');
        const lastQuestion = truncated.lastIndexOf('?');
        
        const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
        
        if (lastSentenceEnd > 0 && lastSentenceEnd > 150) {
          // Use the last complete sentence if it's reasonably long (lowered threshold)
          parsedResult.description = truncated.substring(0, lastSentenceEnd + 1);
        } else {
          // Find the last complete word within 247 characters
          const truncatedForEllipsis = parsedResult.description.substring(0, 247);
          const lastSpace = truncatedForEllipsis.lastIndexOf(' ');
          
          if (lastSpace > 200) {
            // Use the last complete word
            parsedResult.description = truncatedForEllipsis.substring(0, lastSpace) + '...';
          } else {
            // As a last resort, just truncate and add ellipsis
            parsedResult.description = truncatedForEllipsis + '...';
          }
        }
      }

      // Ensure description ends with proper punctuation
      if (parsedResult.description && parsedResult.description.length > 0) {
        const lastChar = parsedResult.description.slice(-1);
        if (!['.', '!', '?'].includes(lastChar)) {
          parsedResult.description += '.';
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
      const fallbackName = itemType === 'lab' ? 'Unknown Component' : 'Unknown Book';
      const fallbackDesc = itemType === 'lab' 
        ? 'AI analysis failed. Please provide a manual description with purpose, features, and functionality details within 250 characters.'
        : 'AI analysis failed. Please provide a manual description with subject matter, target audience, and key topics within 250 characters.';
      const fallbackSpecs = itemType === 'lab'
        ? 'AI analysis failed. Please add technical specifications manually.'
        : 'AI analysis failed. Please add book specifications manually.';
        
      const errorResult = {
        name: fallbackName,
        description: fallbackDesc,
        specifications: fallbackSpecs
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