    
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
    
    def generateQuiz(self, context, current_Questions = {}, N = 3):
        
        parser = JsonOutputParser(pydantic_object=Quiz)
        for i in range(N):
            try:
                prompt = PromptTemplate(
                    template="Answer the user query.\n{format_instructions}\n{query}\n",
                    input_variables=["query"],
                    partial_variables={"format_instructions": parser.get_format_instructions()},
                )
                chain = prompt | self.llm | parser
                current_Questions = self.finalResult 
                q = rf'''Generate a unique question from following context. context: {context}. The following should be the structure for each question:
                {{'question': question, 'opt1':  option 1, 'opt2': option 2, 'opt3': option 3 'opt4': option 4, 'answer': correct option}}
                every question should be unique question and have all four options along with answer and explanation of why the the answer is correct and also why other options are incorect.
                each question has only single correct answer. Be sure to make sure that the options contain answer and ensure that the answer is correct.
                and be extremely sure the question, options, and answer are correct, unique and within the context and not from other sources and also makes sense along with correct explanation for the answer.
                Check the question and answer before submitting. Reduce mistakes and errors.the answer should be given in the form of opt1, opt2, opt3, opt4 NOT as the answer itself the answer should always be any one of 
                opt1, opt2, opt3, opt4.
                here are some examples of the question and answer:
                {{'question': 'What is the output of the following code?\n\npython\nx = "hello"\nprint(x[1:3])\n', 'opt1': 'el', 'opt2': 'lo', 'opt3': 'hel', 'opt4': 'e', 'answer': 'opt1', 'explanation': 'Slicing in Python is zero-based, so x[1:3] extracts characters from index 1 to index 2, not including 3. Therefore, the output is "el".'}}
                {{'question': 'Which of the following statements is true about Python?', 'opt1': 'Python is a statically typed language.', 'opt2': 'Python code must be compiled before execution.', 'opt3': 'Python uses curly braces to define code blocks.', 'opt4': 'Python is an interpreted language.', 'answer': 'opt4', 'explanation': 'Python is an interpreted language, which means that Python code is executed line by line, without the need for a separate compilation step.'}}
                the following questions are already generated and should not be repeated:
                THESE ARE THE QUESTIONS ALREADY GENERATED AND SHOULD NOT BE REPEATED:
                {current_Questions}
                remember that you are being used as a plugin in a program so be sure to return the output in the correct format as there are many errors of Invalid JSON format avoid that
                some problems from previous generations are that the answer is not in the form of opt1, opt2, opt3, opt4 so be sure to return the answer in the correct format.
                and for some questions the options are wrong or contain multiple answers and also for some the explanation is wrong and facts are not correct so be sure to check the question and answer before submitting.
                some of the questions you have generated previously makes no sense or are incorrect and does not contain whole context. CHECK BEFORE SUBMITTING.
                NEVER REPEAT THE QUESTIONS OR OPTIONS OR ANSWER OR EXPLANATION.
                NO REPEATING QUESTIONS OR OPTIONS OR ANSWER OR EXPLANATION.
                IF NOT POSSIBLE TO GENERATE A QUESTION FROM THE CONTEXT THEN RETURN AN EMPTY JSON OBJECT.
                IF NOT POSSIBLE TO GENERATE A QUESTION WITHOUT REPEATING FROM THE CONTEXT THEN RETURN AN EMPTY JSON OBJECT.
                '''
                print(q)
                r = chain.invoke({"query": q})
              
                if self.outputCheck(r):
                    self.finalResult['question'+str(i+1)] = dict(r)
                    if len(self.finalResult) == N:
                        break
                else:
                    self.getQuestion(topic, self.finalResult, N-len(self.finalResult))
            except Exception as e:
                traceback.print_exc()
                new_prompt =rf'''The previous question raised {e} so please generate a new question'''
                self.getQuestion(topic,str(self.finalResult) + new_prompt, N-len(self.finalResult))
        return self.finalResult
            
    def outputCheck(self,r):
        if r['answer'] not in ['opt1', 'opt2', 'opt3', 'opt4']:
            return False
        return True