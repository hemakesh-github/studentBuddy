from typing import List, Dict, Any, Optional, Union
from dataclasses import dataclass
import PyPDF2
import docx
from pathlib import Path
import logging
from abc import ABC, abstractmethod

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DocumentSection:
    """Represents a section of text from a document."""
    content: str
    page_number: Optional[int] = None
    section_number: Optional[int] = None

    def __post_init__(self):
        """Validate the content after initialization."""
        if not self.content.strip():
            raise ValueError("Content cannot be empty")

class DocumentParser(ABC):
    """Abstract base class for document parsers."""
    
    def __init__(self, max_section_length: int = 1000):
        """
        Initialize the document parser.
        
        Args:
            max_section_length (int): Maximum number of characters per section
        """
        if max_section_length < 100:
            raise ValueError("max_section_length must be at least 100 characters")
        self.max_section_length = max_section_length

    @abstractmethod
    def parse(self, file_path: str) -> List[DocumentSection]:
        """Parse the document and return sections."""
        pass

    def _split_into_sections(self, text: str) -> List[str]:
        """
        Split text into manageable sections based on max_section_length.
        
        Args:
            text (str): Text to split into sections
            
        Returns:
            List[str]: List of text sections
        """
        if not text.strip():
            return []

        sections = []
        current_section = []
        current_length = 0
        
        # Split text into paragraphs
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        
        for para in paragraphs:
            if len(para) > self.max_section_length:
                # Split long paragraphs into sentences
                sentences = [s.strip() for s in para.split('. ') if s.strip()]
                for sentence in sentences:
                    if current_length + len(sentence) > self.max_section_length and current_section:
                        sections.append(' '.join(current_section))
                        current_section = []
                        current_length = 0
                    
                    current_section.append(sentence)
                    current_length += len(sentence)
            else:
                if current_length + len(para) > self.max_section_length and current_section:
                    sections.append(' '.join(current_section))
                    current_section = []
                    current_length = 0
                
                current_section.append(para)
                current_length += len(para)
        
        if current_section:
            sections.append(' '.join(current_section))
            
        return sections

class PDFParser(DocumentParser):
    """Parser for PDF documents."""
    
    def parse(self, file_path: str) -> List[DocumentSection]:
        """
        Parse PDF document and return sections.
        
        Args:
            file_path (str): Path to the PDF file
            
        Returns:
            List[DocumentSection]: List of document sections
        """
        sections = []
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    text = page.extract_text()
                    
                    if not text.strip():
                        continue
                        
                    page_sections = self._split_into_sections(text)
                    
                    for section_num, section_text in enumerate(page_sections, 1):
                        sections.append(DocumentSection(
                            content=section_text,
                            page_number=page_num + 1,
                            section_number=section_num
                        ))
                        
        except Exception as e:
            logger.error(f"Error reading PDF file {file_path}: {str(e)}")
            raise
            
        return sections

class DocxParser(DocumentParser):
    """Parser for DOCX documents."""
    
    def parse(self, file_path: str) -> List[DocumentSection]:
        """
        Parse DOCX document and return sections.
        
        Args:
            file_path (str): Path to the DOCX file
            
        Returns:
            List[DocumentSection]: List of document sections

        """

        sections = []
        try:
            doc = docx.Document(file_path)
            
            current_section = []
            current_length = 0
            section_num = 1
            
            for para in doc.paragraphs:
                text = para.text.strip()
                if not text:
                    continue
                
                if current_length + len(text) > self.max_section_length and current_section:
                    sections.append(DocumentSection(
                        content='\n'.join(current_section),
                        section_number=section_num
                    ))
                    current_section = []
                    current_length = 0
                    section_num += 1
                
                current_section.append(text)
                current_length += len(text)
            
            if current_section:
                sections.append(DocumentSection(
                    content='\n'.join(current_section),
                    section_number=section_num
                ))
                
        except Exception as e:
            logger.error(f"Error reading DOCX file {file_path}: {str(e)}")
            raise
        return sections

class TxtParser(DocumentParser):
    """Parser for TXT documents."""
    
    def parse(self, file_path: str) -> List[DocumentSection]:
        """
        Parse TXT document and return sections.
        
        Args:
            file_path (str): Path to the TXT file
            
        Returns:
            List[DocumentSection]: List of document sections
        """
        sections = []
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
                
            if not text.strip():
                return []
                
            page_sections = self._split_into_sections(text)
            
            for section_num, section_text in enumerate(page_sections, 1):
                sections.append(DocumentSection(
                    content=section_text,
                    section_number=section_num
                ))
                
        except Exception as e:
            logger.error(f"Error reading TXT file {file_path}: {str(e)}")
            raise
            
        return sections

class DocumentParserFactory:
    """Factory class for creating appropriate document parsers."""
    
    @staticmethod
    def create_parser(file_path: str, max_section_length: int = 1000) -> DocumentParser:
        """
        Create appropriate parser based on file extension.
        
        Args:
            file_path (str): Path to the document
            max_section_length (int): Maximum section length
            
        Returns:
            DocumentParser: Appropriate parser instance
        """
        file_extension = Path(file_path).suffix.lower()
        parsers = {
            '.pdf': PDFParser,
            '.docx': DocxParser,
            '.txt': TxtParser
        }
        
        parser_class = parsers.get(file_extension)
        if not parser_class:
            raise ValueError(f"Unsupported file type: {file_extension}")
            
        return parser_class(max_section_length=max_section_length)
