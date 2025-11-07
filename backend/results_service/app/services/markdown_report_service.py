"""
Markdown Report Service for generating beautiful Markdown reports
that can be previewed before converting to PDF
"""

from typing import Dict, Any, List
from datetime import datetime
import io

class MarkdownReportService:
    
    @staticmethod
    async def generate_markdown_report(report_data: Dict[str, Any]) -> str:
        """Generate comprehensive Markdown format report"""
        try:
            md_content = []
            
            # Header
            md_content.append("# 🎯 Life Changing Journey")
            md_content.append("## Comprehensive Assessment Report")
            md_content.append("")
            md_content.append("---")
            md_content.append("")
            
            # Report Information
            metadata = report_data["report_metadata"]
            generated_date = datetime.fromisoformat(metadata['generated_at'].replace('Z', '+00:00'))
            formatted_date = generated_date.strftime("%B %d, %Y at %I:%M %p")
            
            md_content.append("### 📋 Report Information")
            md_content.append("| Field | Value |")
            md_content.append("|-------|-------|")
            md_content.append(f"| 📅 Generated | {formatted_date} |")
            md_content.append(f"| 👤 User ID | {metadata['user_id']} |")
            md_content.append(f"| 📊 Report Type | Comprehensive Analysis |")
            ai_included = "Included" if metadata.get('includes_ai_insights') else "Not Included"
            md_content.append(f"| 🤖 AI Insights | {ai_included} |")
            md_content.append("")
            md_content.append("---")
            md_content.append("")
            
            # User Profile
            md_content.append("## 👤 User Profile")
            md_content.append("")
            
            profile = report_data["user_overview"]["profile"]
            
            # Personal Information
            md_content.append("### 📝 Personal Information")
            if profile.get("name"):
                md_content.append(f"- **Name:** {profile['name']}")
            if profile.get("email"):
                md_content.append(f"- **Email:** {profile['email']}")
            if profile.get("location"):
                md_content.append(f"- **Location:** {profile['location']}")
            if profile.get("phone"):
                md_content.append(f"- **Phone:** {profile['phone']}")
            md_content.append("")
            
            # Education & Experience
            md_content.append("### 🎓 Education & Experience")
            if profile.get("education"):
                md_content.append(f"- **Education:** {profile['education']}")
            if profile.get("experience"):
                md_content.append(f"- **Experience:** {profile['experience']}")
            md_content.append("")
            
            # Skills & Goals
            md_content.append("### 💼 Skills & Goals")
            if profile.get("skills"):
                skills_str = ", ".join(profile["skills"]) if isinstance(profile["skills"], list) else str(profile["skills"])
                md_content.append(f"- **Skills:** {skills_str}")
            if profile.get("goals"):
                goals_str = ", ".join(profile["goals"]) if isinstance(profile["goals"], list) else str(profile["goals"])
                md_content.append(f"- **Goals:** {goals_str}")
            md_content.append("")
            md_content.append("---")
            md_content.append("")
            
            # Performance Overview
            md_content.append("## 📊 Performance Overview")
            md_content.append("")
            
            stats = report_data["user_overview"]["statistics"]
            summary = report_data.get("summary", {})
            
            # Key Performance Indicators
            md_content.append("### 🎯 Key Performance Indicators")
            md_content.append("")
            md_content.append("| 🎯 Tests Completed | 📈 Average Score | 🏆 Highest Score | 🎖️ Achievements |")
            md_content.append("|:------------------:|:----------------:|:----------------:|:----------------:|")
            
            tests_completed = stats.get("total_tests_completed", 0)
            avg_score = stats.get("average_score", 0)
            highest_score = summary.get("highest_score", 0)
            achievements = stats.get("achievements", 0)
            
            md_content.append(f"| **{tests_completed}** | **{avg_score:.1f}%** | **{highest_score:.1f}%** | **{achievements}** |")
            md_content.append("| Total assessments taken | Overall performance | Best achievement | Milestones reached |")
            md_content.append("")
            
            # Category Performance
            if stats.get("category_scores"):
                md_content.append("### 📋 Category Performance")
                md_content.append("")
                md_content.append("| Category | Score | Performance Level |")
                md_content.append("|----------|-------|-------------------|")
                
                for category, score in stats["category_scores"].items():
                    performance_level = "Excellent" if score >= 90 else "Good" if score >= 70 else "Average" if score >= 50 else "Needs Improvement"
                    category_name = category.replace('_', ' ').title()
                    md_content.append(f"| **{category_name}** | {score:.1f}% | {performance_level} |")
                md_content.append("")
            
            md_content.append("---")
            md_content.append("")
            
            # Detailed Test Results
            if report_data["test_results"]:
                md_content.append("## 📝 Detailed Test Results")
                md_content.append("")
                
                for i, result in enumerate(report_data["test_results"]):
                    md_content.append(f"### Test {i+1}: {result['test_name']}")
                    md_content.append("")
                    
                    # Test Overview
                    md_content.append("#### 📊 Test Overview")
                    md_content.append("| Metric | Value |")
                    md_content.append("|--------|-------|")
                    md_content.append(f"| 📊 Score | {result['score']}/{result.get('total_questions', 'N/A')} |")
                    md_content.append(f"| 📈 Percentage | {result['percentage']:.1f}% |")
                    completed_date = result["completed_at"][:10] if result["completed_at"] else "N/A"
                    md_content.append(f"| 📅 Completed | {completed_date} |")
                    duration = f"{result['duration_minutes']} minutes" if result["duration_minutes"] else "N/A"
                    md_content.append(f"| ⏱️ Duration | {duration} |")
                    md_content.append(f"| ❓ Questions | {result.get('total_questions', 'N/A')} |")
                    md_content.append("")
                    
                    # Dimension Breakdown
                    if result.get("dimensions_scores"):
                        md_content.append("#### 🎯 Dimension Breakdown")
                        md_content.append("| Dimension | Score | Percentage |")
                        md_content.append("|-----------|-------|------------|")
                        
                        for dim, score in result["dimensions_scores"].items():
                            if isinstance(score, dict):
                                percentage = score.get('percentage', 0)
                                raw_score = score.get('score', 0)
                            else:
                                percentage = score
                                raw_score = score
                            
                            dim_name = dim.replace('_', ' ').title()
                            md_content.append(f"| **{dim_name}** | {raw_score} | {percentage:.1f}% |")
                        md_content.append("")
                    
                    # Analysis
                    if result.get("analysis"):
                        md_content.append("#### 📋 Analysis")
                        md_content.append(str(result["analysis"]))
                        md_content.append("")
                    
                    # Recommendations
                    if result.get("recommendations"):
                        md_content.append("#### 💡 Recommendations")
                        if isinstance(result["recommendations"], list):
                            for rec in result["recommendations"]:
                                md_content.append(f"- {rec}")
                        else:
                            md_content.append(str(result["recommendations"]))
                        md_content.append("")
                    
                    md_content.append("---")
                    md_content.append("")
            
            # AI Insights
            if report_data["ai_insights"]:
                md_content.append("## 🤖 AI-Powered Insights & Analysis")
                md_content.append("")
                
                for i, insight in enumerate(report_data["ai_insights"]):
                    md_content.append(f"### AI Analysis {i+1}: {insight['test_name']}")
                    md_content.append("")
                    
                    # AI Metadata
                    md_content.append("#### 🎯 AI Metadata")
                    md_content.append("| Field | Value |")
                    md_content.append("|-------|-------|")
                    md_content.append(f"| 🎯 Confidence Score | {insight['confidence_score']:.1f}% |")
                    md_content.append(f"| 🤖 AI Model | {insight.get('model', 'Gemini-2.0-Flash')} |")
                    generated_date = insight.get('generated_at', 'N/A')[:10] if insight.get('generated_at') else 'N/A'
                    md_content.append(f"| 📅 Generated | {generated_date} |")
                    md_content.append("")
                    
                    insights_data = insight.get("insights", {})
                    
                    # Personality Traits
                    if insights_data.get("personality_traits"):
                        md_content.append("#### 🧠 Personality Traits")
                        for trait in insights_data["personality_traits"]:
                            md_content.append(f"- **{trait}**")
                        md_content.append("")
                    
                    # Key Strengths
                    if insights_data.get("strengths"):
                        md_content.append("#### 💪 Key Strengths")
                        for strength in insights_data["strengths"]:
                            md_content.append(f"- ✅ **{strength}**")
                        md_content.append("")
                    
                    # Areas for Growth
                    if insights_data.get("areas_for_improvement"):
                        md_content.append("#### 🎯 Areas for Growth")
                        for area in insights_data["areas_for_improvement"]:
                            md_content.append(f"- 🔄 **{area}**")
                        md_content.append("")
                    
                    # Career Recommendations
                    if insights_data.get("career_recommendations"):
                        md_content.append("#### 💼 Career Recommendations")
                        for rec in insights_data["career_recommendations"]:
                            md_content.append(f"- 🚀 **{rec}**")
                        md_content.append("")
                    
                    # Learning Path
                    if insights_data.get("learning_path"):
                        md_content.append("#### 📚 Recommended Learning Path")
                        for step in insights_data["learning_path"]:
                            md_content.append(f"- 📖 **{step}**")
                        md_content.append("")
                    
                    md_content.append("---")
                    md_content.append("")
            
            # Executive Summary
            md_content.append("## 📋 Executive Summary")
            md_content.append("")
            
            # Key Performance Indicators
            md_content.append("### 🎯 Key Performance Indicators")
            md_content.append("")
            md_content.append("| Metric | Value |")
            md_content.append("|--------|-------|")
            md_content.append(f"| 📊 Total Assessments | {summary.get('total_tests', 0)} |")
            md_content.append(f"| 🏆 Highest Achievement | {summary.get('highest_score', 0):.1f}% |")
            md_content.append(f"| 📈 Average Performance | {summary.get('average_score', 0):.1f}% |")
            md_content.append(f"| 📉 Lowest Score | {summary.get('lowest_score', 0):.1f}% |")
            md_content.append(f"| 🕒 Most Recent Test | {summary.get('most_recent_test', 'N/A')} |")
            md_content.append(f"| 📊 Progress Trend | {summary.get('improvement_trend', 'Stable')} |")
            md_content.append("")
            
            # Overall Assessment
            md_content.append("### 🎖️ Overall Assessment")
            md_content.append("")
            
            avg_score = summary.get('average_score', 0)
            performance_level = "Outstanding" if avg_score >= 90 else "Excellent" if avg_score >= 80 else "Good" if avg_score >= 70 else "Satisfactory" if avg_score >= 60 else "Needs Improvement"
            
            md_content.append(f"Based on the comprehensive analysis of **{summary.get('total_tests', 0)}** assessment(s), your overall performance level is classified as **{performance_level}** with an average score of **{avg_score:.1f}%**.")
            md_content.append("")
            md_content.append(f"Your highest achievement reached **{summary.get('highest_score', 0):.1f}%**, demonstrating your potential for excellence. The performance trend shows **{summary.get('improvement_trend', 'Stable')}** progress, indicating {'consistent growth' if summary.get('improvement_trend') == 'Positive' else 'steady performance'}.")
            md_content.append("")
            md_content.append("The AI-powered insights provide personalized recommendations to help you leverage your strengths and address areas for development, creating a clear path for continued growth and success.")
            md_content.append("")
            
            # Next Steps
            md_content.append("### 🚀 Recommended Next Steps")
            md_content.append("")
            md_content.append("| Step | Action | Description |")
            md_content.append("|------|--------|-------------|")
            md_content.append("| **1. 📚 Review AI Insights** | Study Analysis | Study the detailed AI analysis for each assessment to understand your strengths and growth areas. |")
            md_content.append("| **2. 🎯 Set Goals** | Create Plan | Based on the recommendations, set specific, measurable goals for personal and professional development. |")
            md_content.append("| **3. 📈 Track Progress** | Monitor Growth | Retake assessments periodically to monitor your growth and improvement over time. |")
            md_content.append("| **4. 💼 Apply Insights** | Take Action | Use the career recommendations to guide your professional development and decision-making. |")
            md_content.append("| **5. 🤝 Seek Support** | Get Help | Consider working with mentors or coaches to accelerate your development in identified areas. |")
            md_content.append("")
            
            md_content.append("---")
            md_content.append("")
            
            # Footer
            md_content.append("## 📞 Contact & Support")
            md_content.append("")
            md_content.append("**🎯 Life Changing Journey - Assessment Report**  ")
            md_content.append(f"Generated on {formatted_date}")
            md_content.append("")
            md_content.append("*Empowering your personal and professional growth through AI-powered insights*")
            md_content.append("")
            md_content.append("For support or questions, contact us at **support@lifechangingjourneyapp.com**")
            md_content.append("")
            md_content.append("---")
            md_content.append("")
            md_content.append("*This report contains comprehensive analysis of your assessment results, including AI-powered insights designed to help you understand your strengths, identify growth opportunities, and plan your personal and professional development journey.*")
            
            return "\n".join(md_content)
            
        except Exception as e:
            raise Exception(f"Error generating Markdown report: {str(e)}")
    
    @staticmethod
    async def save_markdown_report(report_data: Dict[str, Any], file_path: str) -> str:
        """Save Markdown report to file"""
        try:
            markdown_content = await MarkdownReportService.generate_markdown_report(report_data)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(markdown_content)
            
            return file_path
            
        except Exception as e:
            raise Exception(f"Error saving Markdown report: {str(e)}")
