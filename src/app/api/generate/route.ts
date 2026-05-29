import { runGenerationPipeline } from '../../../lib/pipeline/streamRunner.js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await runGenerationPipeline({
      prompt: body.prompt,
      projectName: body.projectName,
      appType: body.appType,
      techStack: body.techStack,
      features: body.features,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
