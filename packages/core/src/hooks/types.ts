export type SignalType = 'positive' | 'negative' | 'breakthrough' | 'barrier';
export type SignalStatus = 'PENDING' | 'PROCESSED' | 'REWOUND';

export interface SignalPayload {
  rule: string;
  context: string;
  tags: string[];
}

export interface SignalRecord {
  session_id: string;
  message_id: string;
  timestamp: string;
  status: SignalStatus;
  type: SignalType;
  payload: SignalPayload;
  git_anchor: string;
}
