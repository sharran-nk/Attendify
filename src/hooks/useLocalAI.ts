import { useState, useEffect, useRef } from 'react';

/**
 * Interface definition for window.ai Chrome Built-in Prompt API (Gemini Nano)
 */
declare global {
  interface Window {
    ai?: {
      languageModel?: {
        capabilities: () => Promise<{ available: 'readily' | 'after-download' | 'no' }>;
        create: (options?: any) => Promise<{
          prompt: (text: string) => Promise<string>;
          destroy?: () => void;
        }>;
      };
    };
  }
}

export type AIModelStatus = 'checking' | 'ready' | 'downloading' | 'unsupported';

export function useLocalAI() {
  const [status, setStatus] = useState<AIModelStatus>('checking');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkAvailability() {
      try {
        if (typeof window !== 'undefined' && window.ai?.languageModel) {
          const capabilities = await window.ai.languageModel.capabilities();
          if (!isMounted) return;

          if (capabilities.available === 'readily') {
            setStatus('ready');
          } else if (capabilities.available === 'after-download') {
            setStatus('ready'); // Can initialize on demand
          } else {
            setStatus('unsupported');
          }
        } else {
          if (isMounted) setStatus('unsupported');
        }
      } catch (err) {
        if (isMounted) setStatus('unsupported');
      }
    }

    checkAvailability();

    return () => {
      isMounted = false;
      if (sessionRef.current?.destroy) {
        try {
          sessionRef.current.destroy();
        } catch {}
      }
    };
  }, []);

  /**
   * Enhances structured verified attendance data into natural personalized explanations.
   * If local Web AI is not available on this device, returns null and uses deterministic formatting.
   */
  const synthesizeExplanation = async (
    userQuestion: string,
    calculatedFact: string
  ): Promise<string | null> => {
    if (status !== 'ready' || !window.ai?.languageModel) {
      return null;
    }

    try {
      if (!sessionRef.current) {
        sessionRef.current = await window.ai.languageModel.create({
          systemPrompt:
            'You are Attendify AI, a concise, friendly, and helpful college attendance assistant. ' +
            'Your job is to explain the student\'s verified attendance data simply and clearly. ' +
            'Never contradict or invent attendance percentages or counts. Rely strictly on the verified facts provided.',
        });
      }

      const prompt = `Student asked: "${userQuestion}"\nVerified attendance calculation: "${calculatedFact}"\nProvide a friendly, conversational 1-2 sentence response explaining this clearly to the student:`;
      const response = await sessionRef.current.prompt(prompt);
      return response.trim();
    } catch (e) {
      console.warn('Local LLM inference bypassed:', e);
      return null;
    }
  };

  return {
    status,
    downloadProgress,
    synthesizeExplanation,
  };
}
