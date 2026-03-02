import type { Correction } from '@/types/mistakes';
import { motion } from 'framer-motion';

interface CorrectionsThreadProps {
  corrections: Correction[];
}



export function CorrectionsThread({ corrections }: CorrectionsThreadProps) {
  if (corrections.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No corrections yet. Start chatting to see your corrections here!
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {corrections.map((correction) => (
        <motion.div
          key={correction.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow p-4 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium px-2 py-1 rounded ${
              correction.severity === 'major' 
                ? 'bg-red-100 text-red-800'
                : correction.severity === 'moderate'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {correction.type}
            </span>
            <span className="text-sm text-gray-500">
              {correction.subcategory}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-gray-500">Original: </span>
              <span className="line-through text-red-600">{correction.userInput}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Correction: </span>
              <span className="text-green-600">{correction.correction}</span>
            </div>
            <div className="text-sm text-gray-700">
              {correction.explanation}
            </div>
            {correction.grammarRule && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Grammar Rule: </span>
                <span className="text-gray-600">{correction.grammarRule}</span>
              </div>
            )}
            {correction.examples && correction.examples.length > 0 && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Examples: </span>
                <ul className="list-disc list-inside text-gray-600">
                  {correction.examples.map((example, index) => (
                    <li key={index}>{example}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
} 