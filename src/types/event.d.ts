export interface InterviewEvent {
  id: string;
  title: string;
  start: string; // ISO
  end?: string; // ISO
  candidateEmail?: string;
  recruiterEmail?: string;
  timezone?: string;
}
