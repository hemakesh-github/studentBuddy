from langchain.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.pydantic_v1 import BaseModel, Field
import time
import os
import json
import traceback
from dotenv import load_dotenv
from ..llm.config import LLMConfig

class Quiz(BaseModel):
    question: str = Field(description="Question and also program if needed.")
    opt1: str = Field(description="1st option")
    opt2: str = Field(description="2st option")
    opt3: str = Field(description="3st option")
    opt4: str = Field(description="4st option")
    answer: str = Field(description="answer to the generated question only allowed values are one of 'opt1, opt2, opt3, opt4'.")
    explanation: str = Field(description="This is the explanation for the answer to the question.")

        

class QuizGenerator(LLMConfig):
   
    def __init__(
        self,
        model_name: str = "llama-3.3-70b-versatile",
        temperature: float = 0.2,
        max_tokens: int = 1024
    ):
        """
        Initialize Quiz Generator with LLM configuration
        """
        super().__init__(
            model_name=model_name,
            temperature=temperature,
            max_tokens=max_tokens
        )
        self.finalResult = {}
    
    async def generateQuiz(self, context, current_Questions=None, N=3):
        """
        Generate quiz questions asynchronously.
        """
        if current_Questions is None:
            current_Questions = {}

        parser = JsonOutputParser(pydantic_object=Quiz)
        max_attempts = N * 5  # Try at most 5 times per question
        attempts = 0

        while len(current_Questions) < N and attempts < max_attempts:
            attempts += 1
            try:
                previous_questions = [q['question'] for q in current_Questions.values()]
                prev_q_text = "\n".join(previous_questions)
                prompt = PromptTemplate(
                    template=(
                        "Answer the user query.\n{format_instructions}\n{query}\n"
                    ),
                    input_variables=["query"],
                    partial_variables={"format_instructions": parser.get_format_instructions()},
                )
                chain = prompt | self.llm | parser  # <-- Define chain here
                q = rf'''Generate a unique question from the following context. context: {context}.
Do NOT repeat any of these questions: {prev_q_text if prev_q_text else "None"}.
The following should be the structure for each question:
{{'question': question, 'opt1': option 1, 'opt2': option 2, 'opt3': option 3, 'opt4': option 4, 'answer': correct option}}
Every question should be unique and have all four options along with the answer and explanation.
'''
                r = chain.invoke({"query": q})

                # Check for duplicate question
                if r['question'] in previous_questions:
                    continue  # Skip and try again

                if self.outputCheck(r):
                    current_Questions['question' + str(len(current_Questions) + 1)] = dict(r)
                # else: just try again (no recursion)

            except Exception as e:
                traceback.print_exc()
                # Just try again, don't recurse

        self.finalResult = current_Questions
        return self.finalResult
            
    def outputCheck(self,r):
        if r['answer'] not in ['opt1', 'opt2', 'opt3', 'opt4']:
            return False
        return True