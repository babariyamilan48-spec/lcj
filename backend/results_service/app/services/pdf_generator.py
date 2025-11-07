"""
PDF Generation Service for Comprehensive Reports
Converts markdown content to PDF format using reportlab
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from typing import Dict, Any
import tempfile
import os
from datetime import datetime

class PDFGeneratorService:
    
    @staticmethod
    def create_pdf_from_data(
        test_results: Dict[str, Any],
        ai_insights: Dict[str, Any],
        user_id: str,  # Changed from int to str to support UUID
        output_path: str = None
    ) -> str:
        """
        Create PDF directly from data using reportlab
        
        Args:
            test_results: Dictionary of test results
            ai_insights: AI-generated insights
            user_id: User ID
            output_path: Optional output path for PDF file
            
        Returns:
            Path to generated PDF file
        """
        try:
            # Generate output path if not provided
            if not output_path:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_path = f"comprehensive_report_user_{user_id}_{timestamp}.pdf"
            
            # Create PDF document
            doc = SimpleDocTemplate(output_path, pagesize=A4)
            styles = getSampleStyleSheet()
            
            # Custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                spaceAfter=30,
                textColor=HexColor('#e67e22'),
                alignment=1  # Center alignment
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=16,
                spaceAfter=12,
                textColor=HexColor('#d35400')
            )
            
            subheading_style = ParagraphStyle(
                'CustomSubHeading',
                parent=styles['Heading3'],
                fontSize=14,
                spaceAfter=8,
                textColor=HexColor('#e67e22')
            )
            
            normal_style = styles['Normal']
            normal_style.fontSize = 11
            normal_style.spaceAfter = 6
            
            # Build PDF content
            story = []
            
            # Title
            story.append(Paragraph("સંપૂર્ણ કારકિર્દી મૂલ્યાંકન રિપોર્ટ", title_style))
            story.append(Spacer(1, 12))
            
            # Date and User info
            current_date = datetime.now().strftime("%d/%m/%Y")
            story.append(Paragraph(f"<b>તારીખ:</b> {current_date}", normal_style))
            story.append(Paragraph(f"<b>યુઝર ID:</b> {user_id}", normal_style))
            story.append(Spacer(1, 20))
            
            # Test Results Section
            story.append(Paragraph("📊 ટેસ્ટ પરિણામો", heading_style))
            
            if test_results:
                for test_id, result in test_results.items():
                    test_name = result.get('test_name', test_id.upper())
                    score = result.get('percentage') or result.get('score', 'N/A')
                    
                    story.append(Paragraph(f"<b>{test_name}</b>", subheading_style))
                    story.append(Paragraph(f"સ્કોર: {score}%", normal_style))
                    
                    if result.get('analysis', {}).get('code'):
                        story.append(Paragraph(f"પરિણામ: {result['analysis']['code']}", normal_style))
                    
                    story.append(Spacer(1, 10))
            
            # AI Insights Section
            if ai_insights:
                story.append(Paragraph("🤖 AI વિશ્લેષણ", heading_style))
                
                # Top Career Fields
                if ai_insights.get('top_career_fields'):
                    story.append(Paragraph("🎯 ટોપ કારકિર્દી ક્ષેત્રો", subheading_style))
                    
                    for i, field in enumerate(ai_insights['top_career_fields'], 1):
                        story.append(Paragraph(f"<b>{i}. {field.get('field', 'Unknown')} ({field.get('match_percentage', 0)}% મેચ)</b>", normal_style))
                        
                        if field.get('reasoning'):
                            story.append(Paragraph(f"કારણ: {field['reasoning']}", normal_style))
                        
                        if field.get('gujarat_opportunities'):
                            story.append(Paragraph(f"ગુજરાતમાં તકો: {field['gujarat_opportunities']}", normal_style))
                        
                        if field.get('salary_range'):
                            story.append(Paragraph(f"પગાર શ્રેણી: {field['salary_range']}", normal_style))
                        
                        story.append(Spacer(1, 15))
                
                # Strengths
                if ai_insights.get('strengths'):
                    story.append(Paragraph("⭐ તમારી શક્તિઓ", subheading_style))
                    
                    for i, strength in enumerate(ai_insights['strengths'], 1):
                        story.append(Paragraph(f"<b>{i}. {strength.get('strength', 'Unknown')}</b>", normal_style))
                        story.append(Paragraph(f"કારકિર્દીમાં ઉપયોગ: {strength.get('career_application', 'Not specified')}", normal_style))
                        story.append(Paragraph(f"કેવી રીતે લાભ લો: {strength.get('how_to_leverage', 'Not specified')}", normal_style))
                        story.append(Spacer(1, 10))
                
                # Weaknesses
                if ai_insights.get('weaknesses'):
                    story.append(Paragraph("🔧 સુધારણાના ક્ષેત્રો", subheading_style))
                    
                    for i, weakness in enumerate(ai_insights['weaknesses'], 1):
                        story.append(Paragraph(f"<b>{i}. {weakness.get('weakness', 'Unknown')}</b>", normal_style))
                        story.append(Paragraph(f"કારકિર્દી પર અસર: {weakness.get('impact_on_career', 'Not specified')}", normal_style))
                        story.append(Paragraph(f"સુધારણા યોજના: {weakness.get('improvement_plan', 'Not specified')}", normal_style))
                        story.append(Spacer(1, 10))
            
            # Footer
            story.append(Spacer(1, 30))
            story.append(Paragraph(f"આ રિપોર્ટ {current_date} ના રોજ જનરેટ કરવામાં આવ્યો છે.", normal_style))
            story.append(Paragraph("Life Changing Journey - તમારી કારકિર્દીનો સાથી", normal_style))
            
            # Build PDF
            doc.build(story)
            
            return output_path
            
        except Exception as e:
            raise Exception(f"Failed to generate PDF: {str(e)}")
    
    @staticmethod
    def generate_comprehensive_report_pdf(
        test_results: Dict[str, Any],
        ai_insights: Dict[str, Any],
        user_id: str  # Changed from int to str to support UUID
    ) -> str:
        """
        Generate a comprehensive PDF report from test results and AI insights
        
        Args:
            test_results: Dictionary of test results
            ai_insights: AI-generated insights
            user_id: User ID
            
        Returns:
            Path to generated PDF file
        """
        
        # Use the new direct PDF creation method
        return PDFGeneratorService.create_pdf_from_data(
            test_results=test_results,
            ai_insights=ai_insights,
            user_id=user_id
        )
    
    @staticmethod
    def _generate_markdown_content(
        test_results: Dict[str, Any],
        ai_insights: Dict[str, Any],
        user_id: str  # Changed from int to str to support UUID
    ) -> str:
        """Generate markdown content for the comprehensive report"""
        
        current_date = datetime.now().strftime("%d/%m/%Y")
        
        markdown = f"""# સંપૂર્ણ કારકિર્દી મૂલ્યાંકન રિપોર્ટ

**તારીખ:** {current_date}
**યુઝર ID:** {user_id}

---

## 📊 ટેસ્ટ પરિણામો

"""
        
        # Add test results
        if test_results:
            for test_id, result in test_results.items():
                test_name = result.get('test_name', test_id.upper())
                score = result.get('percentage') or result.get('score', 'N/A')
                
                markdown += f"""### {test_name}
- **સ્કોર:** {score}%
"""
                
                if result.get('analysis', {}).get('code'):
                    markdown += f"- **પરિણામ:** {result['analysis']['code']}\n"
                
                if result.get('analysis', {}).get('type'):
                    markdown += f"- **પ્રકાર:** {result['analysis']['type']}\n"
                
                if result.get('completed_at'):
                    completed_date = datetime.fromisoformat(result['completed_at'].replace('Z', '+00:00'))
                    markdown += f"- **પૂર્ણ થયું:** {completed_date.strftime('%d/%m/%Y')}\n"
                
                markdown += "\n"
        
        # Add AI insights
        if ai_insights:
            markdown += """## 🤖 AI વિશ્લેષણ

"""
            
            # Top career fields
            if ai_insights.get('top_career_fields'):
                markdown += """### 🎯 ટોપ કારકિર્દી ક્ષેત્રો

"""
                for i, field in enumerate(ai_insights['top_career_fields'], 1):
                    markdown += f"""#### {i}. {field.get('field', 'Unknown')} ({field.get('match_percentage', 0)}% મેચ)

**કારણ:** {field.get('reasoning', 'No reasoning provided')}

"""
                    if field.get('gujarat_opportunities'):
                        markdown += f"**ગુજરાતમાં તકો:** {field['gujarat_opportunities']}\n\n"
                    
                    if field.get('salary_range'):
                        markdown += f"**પગાર શ્રેણી:** {field['salary_range']}\n\n"
                    
                    if field.get('growth_potential'):
                        markdown += f"**વૃદ્ધિની સંભાવના:** {field['growth_potential']}\n\n"
                    
                    markdown += "---\n\n"
            
            # Add other sections (strengths, weaknesses, etc.)
            if ai_insights.get('strengths'):
                markdown += """### ⭐ તમારી શક્તિઓ

"""
                for i, strength in enumerate(ai_insights['strengths'], 1):
                    markdown += f"""#### {i}. {strength.get('strength', 'Unknown')}
**કારકિર્દીમાં ઉપયોગ:** {strength.get('career_application', 'Not specified')}

**કેવી રીતે લાભ લો:** {strength.get('how_to_leverage', 'Not specified')}

---

"""
            
            if ai_insights.get('weaknesses'):
                markdown += """### 🔧 સુધારણાના ક્ષેત્રો

"""
                for i, weakness in enumerate(ai_insights['weaknesses'], 1):
                    markdown += f"""#### {i}. {weakness.get('weakness', 'Unknown')}
**કારકિર્દી પર અસર:** {weakness.get('impact_on_career', 'Not specified')}

**સુધારણા યોજના:** {weakness.get('improvement_plan', 'Not specified')}

---

"""
        
        markdown += f"""

---

*આ રિપોર્ટ {current_date} ના રોજ જનરેટ કરવામાં આવ્યો છે.*
*Life Changing Journey - તમારી કારકિર્દીનો સાથી*
"""
        
        return markdown
