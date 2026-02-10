export type Word = {
  id: string;
  pl: string;
  uk: string;
  pos: string;
  type:
    | "verb"
    | "adverb"
    | "adjective"
    | "slang"
    | "others"
    | "soft_swears"
    | "clean_emotions"
    | "abbreviations"
    | "aspect_pairs"
    | "my_words";
  source: string;
};

export type Test = {
  id: string;
  title: string;
  source: string;
  version: string;
  questions?: TestQuestion[];
};

export type TestQuestion = {
  id: string;
  number: number;
  type: string;
  prompt: string;
  options: { id: string; text: string }[];
  answer: string | string[];
  answerType: string;
};
