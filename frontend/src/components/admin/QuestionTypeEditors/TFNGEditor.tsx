'use client';

import { type TFNGData } from '@/types/test';
import { Textarea } from '@/components/ui/Textarea';

interface TFNGEditorProps {
  data: TFNGData;
  correctAnswer: any;
  onChange: (data: TFNGData, correctAnswer: any) => void;
}

const TFNG_OPTIONS = ['TRUE', 'FALSE', 'NOT GIVEN'];
const YNNG_OPTIONS = ['YES', 'NO', 'NOT GIVEN'];

export default function TFNGEditor({ data, correctAnswer, onChange }: TFNGEditorProps) {
  const statement = data.statement || '';
  const isTFNG = !data.options || data.options.includes('TRUE');
  const optionSet = isTFNG ? TFNG_OPTIONS : YNNG_OPTIONS;

  const handleStatementChange = (value: string) => {
    onChange({ ...data, statement: value }, correctAnswer);
  };

  const handleCorrectAnswerChange = (answer: string) => {
    onChange(data, answer);
  };

  const handleTypeToggle = (useTFNG: boolean) => {
    const newOptions = useTFNG ? TFNG_OPTIONS : YNNG_OPTIONS;
    // Map the correct answer to the new option set
    let newCorrect = correctAnswer;
    if (correctAnswer === 'TRUE' || correctAnswer === 'YES') {
      newCorrect = useTFNG ? 'TRUE' : 'YES';
    } else if (correctAnswer === 'FALSE' || correctAnswer === 'NO') {
      newCorrect = useTFNG ? 'FALSE' : 'NO';
    }
    onChange({ ...data, options: newOptions }, newCorrect);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Answer Type:</label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            name="tfng-type"
            checked={isTFNG}
            onChange={() => handleTypeToggle(true)}
            className="border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          True / False / Not Given
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            name="tfng-type"
            checked={!isTFNG}
            onChange={() => handleTypeToggle(false)}
            className="border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Yes / No / Not Given
        </label>
      </div>

      <Textarea
        label="Statement"
        value={statement}
        onChange={(e) => handleStatementChange(e.target.value)}
        placeholder="Enter the statement that the test-taker must evaluate..."
        rows={3}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Correct Answer</label>
        <div className="flex gap-3">
          {optionSet.map((option) => (
            <label
              key={option}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                correctAnswer === option
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="correct-tfng"
                value={option}
                checked={correctAnswer === option}
                onChange={() => handleCorrectAnswerChange(option)}
                className="sr-only"
              />
              {option}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
