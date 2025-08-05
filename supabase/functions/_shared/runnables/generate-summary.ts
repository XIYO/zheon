/**
 * YouTube 영상 요약 생성 Runnable
 * 입력: { youtube_url: string, transcript: string, transcript_length: number, cached: boolean }
 * 출력: 입력 데이터 + { summary: string, summary_method: string }
 */

import { RunnableLambda } from "npm:@langchain/core/runnables";
// 향후 실제 LangChain 통합
// import { ChatOpenAI } from "npm:@langchain/openai";
// import { PromptTemplate } from "npm:@langchain/core/prompts";

export const generateSummary = RunnableLambda.from(
  async (input: { 
    youtube_url: string; 
    transcript: string; 
    transcript_length: number; 
    cached: boolean;
  }) => {
    console.log(`[Summary] Generating for ${input.transcript_length} chars...`);
    
    // TODO: 실제 LangChain 요약 구현
    // const model = new ChatOpenAI({ 
    //   modelName: "gpt-4",
    //   apiKey: Deno.env.get("OPENAI_API_KEY")
    // });
    // 
    // const prompt = PromptTemplate.fromTemplate(`
    //   다음 YouTube 영상 자막을 간결하게 요약해주세요:
    //   
    //   {transcript}
    //   
    //   요약:
    // `);
    // 
    // const chain = prompt.pipe(model);
    // const { content } = await chain.invoke({ transcript: input.transcript });
    
    // 임시 요약 (실제 구현 전)
    const summary = `[자동 요약] 이 영상은 ${input.transcript.substring(0, 100)}... 에 대한 내용입니다.`;
    
    // 이전 데이터 + 새 데이터를 다음으로 전달
    return {
      ...input,
      summary: summary,
      summary_method: "placeholder_summary"
    };
  }
);