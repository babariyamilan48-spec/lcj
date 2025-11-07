import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, DollarSign, Target, CheckCircle, ArrowRight } from 'lucide-react';

interface LifeSituationResultsProps {
  testResults: any;
  calculatedResult: any;
  userAnswers: any;
  questions: any[];
}

const LifeSituationResults: React.FC<LifeSituationResultsProps> = ({
  testResults,
  calculatedResult,
  userAnswers,
  questions
}) => {
  // Get questions from the life situation test
  const getQuestionsAndAnswers = () => {
    const questionsAndAnswers: Array<{
      category: string;
      categoryGujarati: string;
      question: string;
      selectedAnswer: string;
      icon: React.ReactNode;
      color: string;
    }> = [];

    // Define categories with their Gujarati names and icons
    const categories = {
      family: {
        gujarati: 'કુટુંબ અને સમાજ',
        english: 'Family & Society',
        icon: <Users className="w-5 h-5" />,
        color: 'from-blue-500 to-blue-600'
      },
      financial: {
        gujarati: 'આર્થિક પરિસ્થિતિ',
        english: 'Financial Situation',
        icon: <DollarSign className="w-5 h-5" />,
        color: 'from-green-500 to-green-600'
      },
      career: {
        gujarati: 'ભૌગોલિક અને કારકિર્દી',
        english: 'Geographic & Career',
        icon: <MapPin className="w-5 h-5" />,
        color: 'from-purple-500 to-purple-600'
      }
    };

    // Check if we have processed answers from the calculator
    if (calculatedResult?.processed_answers) {
      calculatedResult.processed_answers.forEach((processedAnswer: any) => {
        const categoryKey = processedAnswer.category;
        const categoryInfo = categories[categoryKey as keyof typeof categories];
        
        if (categoryInfo && processedAnswer.answer) {
          questionsAndAnswers.push({
            category: categoryInfo.english,
            categoryGujarati: categoryInfo.gujarati,
            question: processedAnswer.question_text || `Question ${processedAnswer.question_number}`,
            selectedAnswer: processedAnswer.answer.text || processedAnswer.answer,
            icon: categoryInfo.icon,
            color: categoryInfo.color
          });
        }
      });
    }
    // Fallback: Process questions if available
    else if (questions && questions.length > 0) {
      questions.forEach((question, index) => {
        const questionKey = `q${index + 1}`;
        const userAnswer = userAnswers?.[questionKey];
        
        if (question.question && userAnswer) {
          // Determine category based on question index (5 questions per category)
          let category = 'family';
          if (index >= 5 && index < 10) category = 'financial';
          else if (index >= 10) category = 'career';
          
          questionsAndAnswers.push({
            category: categories[category as keyof typeof categories].english,
            categoryGujarati: categories[category as keyof typeof categories].gujarati,
            question: question.question,
            selectedAnswer: userAnswer.text || userAnswer,
            icon: categories[category as keyof typeof categories].icon,
            color: categories[category as keyof typeof categories].color
          });
        }
      });
    }
    // Final fallback: Process raw userAnswers if available
    else if (userAnswers || calculatedResult?.userAnswers) {
      const answers = userAnswers || calculatedResult?.userAnswers;
      Object.entries(answers).forEach(([key, answer], index) => {
        // Determine category based on question index (5 questions per category)
        let category = 'family';
        if (index >= 5 && index < 10) category = 'financial';
        else if (index >= 10) category = 'career';
        
        // Extract question and answer from the data structure
        const answerData = answer as any;
        const questionText = answerData?.question || `પ્રશ્ન ${index + 1}`;
        const selectedAnswer = answerData?.answer || answerData?.text || answerData;
        
        questionsAndAnswers.push({
          category: categories[category as keyof typeof categories].english,
          categoryGujarati: categories[category as keyof typeof categories].gujarati,
          question: questionText,
          selectedAnswer: selectedAnswer,
          icon: categories[category as keyof typeof categories].icon,
          color: categories[category as keyof typeof categories].color
        });
      });
    }

    return questionsAndAnswers;
  };

  const questionsAndAnswers = getQuestionsAndAnswers();
  const totalQuestions = questionsAndAnswers.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-primary rounded-full mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            જીવન પરિવર્તન સફર
          </h1>
          <p className="text-lg text-gray-600 mb-2">Life Transformation Journey</p>
          <p className="text-sm text-gray-500">તમારા પ્રશ્નો અને જવાબો • Your Questions and Answers</p>
        </motion.div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-orange-200/50 shadow-lg text-center">
            <div className="text-2xl font-bold text-orange-600">{totalQuestions}</div>
            <div className="text-sm text-orange-500">Total Questions</div>
            <div className="text-xs text-gray-500 gujarati-text">કુલ પ્રશ્નો</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-orange-200/50 shadow-lg text-center">
            <div className="text-2xl font-bold text-green-600">3</div>
            <div className="text-sm text-green-500">Categories</div>
            <div className="text-xs text-gray-500 gujarati-text">વિભાગો</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-orange-200/50 shadow-lg text-center">
            <div className="text-2xl font-bold text-blue-600">100%</div>
            <div className="text-sm text-blue-500">Completed</div>
            <div className="text-xs text-gray-500 gujarati-text">પૂર્ણ</div>
          </div>
        </div>

        {/* Questions and Answers */}
        <div className="space-y-6">
          {questionsAndAnswers.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {/* Category Header */}
              <div className="flex items-center mb-4">
                <div className={`w-10 h-10 bg-gradient-to-r ${item.color} rounded-lg flex items-center justify-center mr-3`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{item.categoryGujarati}</h3>
                  <p className="text-sm text-gray-600">{item.category}</p>
                </div>
                <div className="ml-auto">
                  <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
                    Q{index + 1}
                  </span>
                </div>
              </div>

              {/* Question */}
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2 gujarati-text leading-relaxed">
                  {item.question}
                </h4>
              </div>

              {/* Selected Answer */}
              <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-green-800 font-semibold gujarati-text">
                    {item.selectedAnswer}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Selected Answer • પસંદ કરેલ જવાબ</p>
                </div>
                <ArrowRight className="w-4 h-4 text-green-600 ml-2" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-orange-200/50 text-center"
        >
          <div className="flex items-center justify-center mb-2">
            <Target className="w-5 h-5 text-orange-600 mr-2" />
            <h4 className="font-bold text-gray-800">Assessment Summary</h4>
          </div>
          <p className="text-gray-600 text-sm gujarati-text">
            આ તમારા જીવન પરિવર્તન સફરના પ્રશ્નો અને તમારા પસંદ કરેલા જવાબો છે
          </p>
          <p className="text-gray-500 text-xs mt-1">
            These are your Life Transformation Journey questions and your selected answers
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LifeSituationResults;
