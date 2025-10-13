import { assertEquals } from "jsr:@std/assert";
import { splitIntoChunks } from "./text-chunker.ts";
import { mergePCMChunks, createWavFile } from "./audio-assembler.ts";

Deno.test("text-chunker: splits text into 3 chunks", () => {
  const text = "첫 번째 문장입니다. 두 번째 문장입니다. 세 번째 문장입니다. 네 번째 문장입니다. 다섯 번째 문장입니다. 여섯 번째 문장입니다.";
  const chunks = splitIntoChunks(text, 3);

  assertEquals(chunks.length, 3);
  console.log("Chunks:", chunks.map(c => `[${c.length}자] ${c.substring(0, 20)}...`));
});

Deno.test("text-chunker: handles single chunk", () => {
  const text = "짧은 텍스트";
  const chunks = splitIntoChunks(text, 1);

  assertEquals(chunks.length, 1);
  assertEquals(chunks[0], text);
});

Deno.test("audio-assembler: merges PCM chunks", () => {
  const chunk1 = new Uint8Array([1, 2, 3]);
  const chunk2 = new Uint8Array([4, 5, 6]);
  const chunk3 = new Uint8Array([7, 8, 9]);

  const merged = mergePCMChunks([chunk1, chunk2, chunk3]);

  assertEquals(merged.length, 9);
  assertEquals(Array.from(merged), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

Deno.test("audio-assembler: creates WAV file with correct header", () => {
  const pcmData = new Uint8Array(1000);
  const wavBuffer = createWavFile(pcmData, 24000, 1, 16);

  // WAV header is 44 bytes
  assertEquals(wavBuffer.length, 44 + 1000);

  // Check RIFF header
  const riffHeader = String.fromCharCode(...wavBuffer.slice(0, 4));
  assertEquals(riffHeader, "RIFF");

  // Check WAVE format
  const waveFormat = String.fromCharCode(...wavBuffer.slice(8, 12));
  assertEquals(waveFormat, "WAVE");

  console.log("✅ WAV file structure is valid");
});

Deno.test("integration: full TTS flow simulation", async () => {
  console.log("\n=== Integration Test ===");

  const testText = "안녕하세요. 이것은 테스트 텍스트입니다. 여러 문장으로 구성되어 있습니다.";

  // 1. Split text
  console.log("1. Splitting text into chunks...");
  const chunks = splitIntoChunks(testText, 3);
  console.log(`   ✅ Created ${chunks.length} chunks`);

  // 2. Simulate PCM generation (in real scenario, this would be from Gemini API)
  console.log("2. Simulating PCM generation...");
  const mockPCMChunks = chunks.map((chunk, i) => {
    const size = chunk.length * 100; // Mock PCM size
    return new Uint8Array(size).fill(i);
  });
  console.log(`   ✅ Generated ${mockPCMChunks.length} PCM chunks`);

  // 3. Merge PCM
  console.log("3. Merging PCM chunks...");
  const mergedPCM = mergePCMChunks(mockPCMChunks);
  console.log(`   ✅ Merged PCM size: ${mergedPCM.length} bytes`);

  // 4. Create WAV
  console.log("4. Creating WAV file...");
  const wavBuffer = createWavFile(mergedPCM, 24000, 1, 16);
  console.log(`   ✅ WAV file size: ${wavBuffer.length} bytes`);

  // Verify
  assertEquals(wavBuffer.length, 44 + mergedPCM.length);
  console.log("\n✅ Integration test passed!");
});
