export enum LoadingState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING', // Text analysis
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export enum AppMode {
  DREAM = 'DREAM',
  ACTIVE_IMAGINATION = 'ACTIVE_IMAGINATION',
  PROJECTION = 'PROJECTION'
}

export type DesignTheme = 'CLASSIC' | 'NIGHT_SEA' | 'LIBER_NOVUS';

export type MessageType = 
  | 'TEXT' 
  | 'ARCHETYPES_CARD' 
  | 'DYNAMICS_SHADOW' 
  | 'DYNAMICS_ANIMA'
  | 'DYNAMICS_SELF';

export interface ChatMessage {
  role: 'user' | 'model';
  type: MessageType;
  text: string; // Used for normal text or summary
  data?: any; // Used to hold structured data for cards
}

export interface DreamAnalysis {
  summary: string;
  archetypes: {
    name: string;
    description: string;
    manifestation: string;
  }[];
  jungianPerspective: {
    shadow: string; // The repressed side / Conflict
    anima_animus: string; // The Soul Image / Connection
    self: string; // The unification / Goal
  };
}

// Interface for our custom DeepSeek chat session
// Fix: Added forceJson optional parameter to match usage in geminiService.ts
export interface ChatSession {
    sendMessage(params: { message: string }, forceJson?: boolean): Promise<{ text: string }>;
    history: { role: string; content: string }[];
}

// Wrapper for the initial analysis service response
export interface AnalysisResponse {
  isComplete: boolean;
  guideQuestion?: string; // If isComplete is false
  analysis: DreamAnalysis; // Now mandatory, even if preliminary
}

export interface DreamResult {
  analysis: DreamAnalysis;
  originalText: string;
  timestamp: number;
  isComplete: boolean;
  guideQuestion?: string;
  initialSession?: ChatSession; // Using our generic interface
}

// For the conversational refinement loop
export interface RefinementResponse {
  isRefined: boolean;
  nextQuestion?: string; // If isRefined is false
  refinedAnalysis?: DreamAnalysis; // If isRefined is true
  refinedAnalysisSummaryText?: string; // Conversational summary of the new analysis
}

// For Mind Atlas (Local Storage)
export interface Insight {
  text: string;
  timestamp: number;
}

export interface StoredArchetype {
  name: string;
  insights: Insight[];
}