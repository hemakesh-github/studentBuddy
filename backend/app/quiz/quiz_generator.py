from typing import List, Dict, Any
from dataclasses import dataclass
import os
from dotenv import load_dotenv
import json
import random
from langchain.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field

@dataclass
class QuizQuestion:
    question: str
    options: List[str]
    correct_answer: str
    explanation: str

class QuizQuestionSchema(BaseModel):
    question: str = Field(description="The quiz question text")
    options: List[str] = Field(description="List of 4 possible answers")
    correct_answer: str = Field(description="The correct answer from the options")
    explanation: str = Field(description="Explanation of why this is the correct answer")

class QuizGenerator:
    def __init__(
        self,
        model_name: str = "llama-3.3-70b-versatile",
        temperature: float = 0.7,
        max_tokens: int = 1024
    ):
        """
        Initialize Quiz Generator with LLM configuration
        """
        # Load environment variables
        load_dotenv()
        
        # Initialize Groq client through LangChain
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        # Initialize LangChain Groq client with minimal configuration
        self.llm = ChatGroq(
            groq_api_key=self.api_key,
            model_name=model_name,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        # Initialize output parser
        self.parser = PydanticOutputParser(pydantic_object=QuizQuestionSchema)
        
        # Create prompt template
        self.prompt_template = PromptTemplate(
            template="""<s>[INST] You are a quiz generation expert. Generate {num_questions} multiple choice questions based on the following context.

Context: {context}

Generate questions in the following JSON format:
{format_instructions}

Rules:
1. Each question must have exactly 4 options
2. Options must be clear and distinct
3. Only one option should be correct
4. Include a detailed explanation for the correct answer
5. Questions should test understanding, not just memorization
6. Use clear and concise language
7. Ensure the JSON is properly formatted

[/INST]</s>""",
            input_variables=["context", "num_questions"],
            partial_variables={"format_instructions": self.parser.get_format_instructions()}
        )

    def _generate_quiz_prompt(self, context: str, num_questions: int = 5) -> str:
        """
        Generate prompt for quiz question generation
        """
        return self.prompt_template.format(
            context=context,
            num_questions=num_questions
        )

    def _parse_llm_response(self, response: str) -> List[QuizQuestion]:
        """
        Parse LLM response into QuizQuestion objects
        """
        try:
            # Extract JSON from response
            start_idx = response.find('[')
            end_idx = response.rfind(']')
            
            if start_idx == -1 or end_idx == -1:
                raise ValueError("Cannot find JSON array in response")
                
            json_str = response[start_idx:end_idx+1]
            questions_data = json.loads(json_str)
            
            # Convert to QuizQuestion objects
            questions = []
            for q in questions_data:
                questions.append(QuizQuestion(
                    question=q['question'],
                    options=q['options'],
                    correct_answer=q['correct_answer'],
                    explanation=q['explanation']
                ))
            return questions
        except Exception as e:
            print(f"Raw response: {response}")
            raise ValueError(f"Failed to parse LLM response: {str(e)}")

    def generate_quiz(
        self,
        context: str,
        num_questions: int = 5,
        shuffle_options: bool = True
    ) -> List[QuizQuestion]:
        """
        Generate quiz questions from the given context
        
        Args:
            context (str): The context/topic for quiz generation
            num_questions (int): Number of questions to generate
            shuffle_options (bool): Whether to shuffle the options
            
        Returns:
            List[QuizQuestion]: List of quiz questions
        """
        try:
            # Generate prompt
            prompt = self._generate_quiz_prompt(context, num_questions)
            
            # Get completion from LLM using LangChain
            response = self.llm.invoke(prompt)
            
            # Parse response
            questions = self._parse_llm_response(response.content)
            
            # Shuffle options if requested
            if shuffle_options:
                for question in questions:
                    random.shuffle(question.options)
            
            return questions
            
        except Exception as e:
            raise Exception(f"Failed to generate quiz: {str(e)}")

    def to_json(self, questions: List[QuizQuestion]) -> str:
        """
        Convert quiz questions to JSON string
        """
        return json.dumps([{
            'question': q.question,
            'options': q.options,
            'correct_answer': q.correct_answer,
            'explanation': q.explanation
        } for q in questions], indent=2)

# Example usage
if __name__ == "__main__":
    # Initialize quiz generator
    quiz_gen = QuizGenerator()
    
    # Example context
    context = """
    Python is a high-level, interpreted programming language. It was created by Guido van Rossum 
    and first released in 1991. Python's design philosophy emphasizes code readability with its 
    notable use of significant whitespace. Python features a dynamic type system and automatic 
    memory management. It supports multiple programming paradigms, including structured, 
    object-oriented, and functional programming.
    """
    
    try:
        # Generate quiz
        questions = quiz_gen.generate_quiz(context, num_questions=3)
        
        # Print questions
        print(quiz_gen.to_json(questions))
        
    except Exception as e:
        print(f"Error: {str(e)}")