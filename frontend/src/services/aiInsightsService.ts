import api from './api';

export interface AIInsightRequest {
  test_type: string;
  test_id: string;
  answers: any[];
  results: any;
  user_id?: string;
}

export interface ComprehensiveAIRequest {
  user_id: string; // Changed to string to support UUID
  all_test_results: {
    mbti?: any;
    intelligence?: any;
    bigfive?: any;
    riasec?: any;
    decision?: any;
    vark?: any;
    'life-situation'?: any;
  };
}

export interface BestField {
  field: string;
  reasoning: string;
  match_percentage: number;
  gujarat_opportunities?: string;
  indian_market_outlook?: string;
  specific_companies?: string;
  salary_expectations?: string;
  growth_potential?: string;
  entry_requirements?: string;
}

export interface Roadmap {
  short_term: {
    duration: string;
    goals: string[];
    skills_to_develop: string[];
    resources: string[];
    gujarati_courses?: string;
    specific_actions?: string[];
    timeline?: string;
    success_metrics?: string;
  };
  mid_term: {
    duration: string;
    goals: string[];
    skills_to_develop: string[];
    milestones: string[];
    internship_opportunities?: string;
    networking_events?: string;
    project_ideas?: string;
    mentorship_opportunities?: string;
  };
  long_term: {
    duration: string;
    goals: string[];
    expertise_areas: string[];
    leadership_development: string[];
    entrepreneurship_opportunities?: string;
    career_transition_plan?: string;
    financial_planning?: string;
    work_life_balance?: string;
  };
}

export interface ResultAnalysis {
  strengths: {
    strength: string;
    reasoning: string;
    career_application: string;
  }[];
  weaknesses: {
    weakness: string;
    reasoning: string;
    improvement_strategy: string;
  }[];
}

export interface CareerRecommendation {
  job_role: string;
  industry: string;
  explanation: string;
  growth_potential: string;
  salary_range: string;
  gujarat_companies?: string;
  remote_opportunities?: string;
  required_skills?: string;
  day_to_day_tasks?: string;
  career_progression?: string;
  challenges?: string;
  benefits?: string;
  work_environment?: string;
}

export interface SkillRecommendations {
  technical_skills: {
    skill: string;
    importance: string;
    learning_resources: string[];
    gujarati_tutorials?: string;
  }[];
  soft_skills: {
    skill: string;
    importance: string;
    development_approach: string;
    practical_exercises?: string;
  }[];
}

export interface SkillGap {
  gap: string;
  impact: string;
  priority: string;
  learning_path: string;
  free_resources?: string;
}

export interface FuturePlans {
  "3_year_plan": {
    career_position: string;
    key_achievements: string[];
    skills_mastered: string[];
    network_goals: string;
    gujarat_opportunities?: string;
  };
  "5_year_plan": {
    career_position: string;
    expertise_areas: string[];
    leadership_role: string;
    industry_impact: string;
    entrepreneurship_goals?: string;
  };
  "10_year_plan": {
    career_vision: string;
    legacy_goals: string[];
    mentorship_role: string;
    entrepreneurial_potential: string;
    gujarat_contribution?: string;
  };
}

export interface DailyHabit {
  habit: string;
  purpose: string;
  implementation: string;
  time_required: string;
  gujarati_resources?: string;
}

export interface Certification {
  name: string;
  provider: string;
  direct_enrollment_link: string;
  why_recommended: string;
  difficulty_level: string;
  estimated_duration: string;
  gujarat_centers?: string;
  online_options?: string;
}

export interface AdditionalInsights {
  work_environment?: string;
  team_dynamics?: string;
  stress_management?: string;
  work_life_balance?: string;
  gujarat_specific_advice?: string;
  networking_tips?: string;
  mentorship_opportunities?: string;
}

export interface BookRecommendation {
  title: string;
  author: string;
  gujarati_title?: string;
  why_recommended: string;
  key_topics: string[];
  difficulty_level: string;
  amazon_link?: string;
  local_availability?: string;
}

export interface ComprehensiveAIInsights {
  // Redirect properties for one-time restriction
  redirect_to_history?: boolean;
  message?: string;
  existing_result_id?: string;

  // 3 Best Career Fields (no match_percentage)
  top_career_fields: {
    field: string;
    reasoning: string;
    gujarat_opportunities?: string;
    salary_expectations?: string;
    salary_range?: string;
    growth_potential?: string;
  }[];

  // Detailed Career Roadmaps for each field
  career_roadmaps: {
    [field: string]: {
      beginner_phase: {
        duration: string;
        skills_to_learn: string[];
        certifications: string[];
        timeline?: string;
        projects?: string[]; // Optional, some phases have projects instead of resources
      };
      intermediate_phase: {
        duration: string;
        skills_to_learn: string[];
        certifications: string[];
        timeline?: string;
        projects?: string[];
      };
      expert_phase: {
        duration: string;
        skills_to_learn: string[];
        certifications?: string[];
        timeline?: string;
        leadership_roles: string[];
      };
    };
  };

  // Strengths and Weaknesses - Now simple string arrays with bullet points
  strengths: string[];
  weaknesses: string[];

  // Daily Habits - Now simple string array with bullet points
  daily_habits: string[];

  // Certifications
  recommended_certifications: {
    priority: string;
    certification: {
      name: string;
      why_recommended: string;
      estimated_duration: string;
      direct_enrollment_link: string;
    };
    skills_gained: string[];
    career_impact: string;
  }[];

  // NEW FIELDS - Book Recommendations
  recommended_books: {
    title: string;
    author: string;
    why_recommended: string;
    key_takeaways: string[];
    relevance_to_career: string;
  }[];

  // NEW FIELDS - Personality Insights
  personality_insights: {
    mbti_analysis: string;
    big_five_summary: string;
    learning_style: string;
    work_environment: string;
    leadership_potential: string;
  };

  // NEW FIELDS - Networking Suggestions
  networking_suggestions: string[];

  // NEW FIELDS - Skill Development Plan
  skill_development_plan: {
    immediate_focus: string[];
    six_month_goals: string[];
    one_year_vision: string;
  };

  // Skills Development (optional - for backward compatibility)
  skills_to_develop?: {
    technical_skills: {
      skill: string;
      importance: string;
      learning_path: string[];
      estimated_time: string;
    }[];
    soft_skills: {
      skill: string;
      importance: string;
      development_approach: string;
      practice_methods: string[];
    }[];
  };

  // Book Recommendations (optional - old format for backward compatibility)
  book_recommendations?: {
    career_development: BookRecommendation[];
    skill_building: BookRecommendation[];
    weakness_improvement: BookRecommendation[];
  };
}

// Keep the old interface for backward compatibility
export interface AIInsights {
  best_field: BestField;
  roadmap: Roadmap;
  result_analysis: ResultAnalysis;
  career_recommendations: CareerRecommendation[];
  skill_recommendations: SkillRecommendations;
  skill_gaps: SkillGap[];
  future_plans: FuturePlans;
  daily_habits: DailyHabit[];
  certifications: Certification[];
  additional_insights?: AdditionalInsights;
}

export interface AIInsightResponse {
  success: boolean;
  insights?: AIInsights;
  error?: string;
  generated_at?: string;
  model?: string;
}

import { getApiBaseUrl } from '../config/api';

class AIInsightsService {
  private getBaseUrl(): string {
    return `${getApiBaseUrl()}/api/v1/results_service/ai-insights`;
  }

  async generateComprehensiveInsights(request: ComprehensiveAIRequest): Promise<{
    success: boolean;
    insights?: ComprehensiveAIInsights;
    error?: string;
  }> {
    try {

      const response = await api.post(
        `${this.getBaseUrl()}/comprehensive`,
        request,
        {
          timeout: 180000, // 3 minute timeout for comprehensive analysis
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {

      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to generate comprehensive insights'
        // No fallback insights - let UI handle the error properly
      };
    }
  }

  async generateInsights(request: AIInsightRequest): Promise<AIInsightResponse> {
    try {

      const response = await api.post<AIInsightResponse>(
        `${this.getBaseUrl()}/generate`,
        request,
        {
          timeout: 120000, // 2 minute timeout for AI processing
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {

      // Return fallback insights if API fails
      const errorDetail = error.response?.data?.detail;
      let errorMessage = 'Failed to generate AI insights';

      if (typeof errorDetail === 'string') {
        errorMessage = errorDetail;
      } else if (Array.isArray(errorDetail) && errorDetail.length > 0) {
        // Handle validation errors array
        errorMessage = errorDetail.map(err => err.msg || err.message || 'Validation error').join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
        // No fallback insights - let UI handle the error properly
      };
    }
  }

  async validateInsights(insights: AIInsights): Promise<{ valid: boolean; message: string }> {
    try {
      const response = await api.post(
        `${this.getBaseUrl()}/validate-insights`,
        insights
      );
      return response.data;
    } catch (error) {
      console.error('Error validating insights:', error);
      return { valid: false, message: 'Validation failed' };
    }
  }

  async healthCheck(): Promise<{ status: string; service: string; model?: string }> {
    try {
      const response = await api.get(`${this.getBaseUrl()}/health`);
      return response.data;
    } catch (error) {
      console.error('AI service health check failed:', error);
      return { status: 'unhealthy', service: 'ai-insights' };
    }
  }

  getFallbackInsights(): AIInsights {
    return {
      best_field: {
        field: "વ્યવસાયિક સેવાઓ/સલાહકાર",
        reasoning: "તમારા મૂલ્યાંકન પ્રત્યેનો વિચારશીલ અભિગમ મજબૂત વિશ્લેષણાત્મક અને સલાહકાર ક્ષમતાઓ સૂચવે છે",
        match_percentage: 82,
        gujarat_opportunities: "ગુજરાતમાં કન્સલ્ટિંગ કંપનીઓ અને સેવા પ્રદાતાઓ",
        indian_market_outlook: "ભારતીય બજારમાં વ્યવસાયિક સેવાઓની મજબૂત માંગ"
      },
      roadmap: {
        short_term: {
          duration: "1-3 મહિના",
          goals: ["સમગ્ર કુશળતા મૂલ્યાંકન પૂર્ણ કરો", "ઉદ્યોગ તકોનો સંશોધન કરો"],
          skills_to_develop: ["વ્યવસાયિક સંચાર", "ઉદ્યોગ જ્ઞાન"],
          resources: ["LinkedIn Learning", "ઉદ્યોગ પ્રકાશનો"],
          gujarati_courses: "ગુજરાતમાં ઉપલબ્ધ વ્યવસાયિક કોર્સ"
        },
        mid_term: {
          duration: "6-12 મહિના",
          goals: ["વ્યવસાયિક પોર્ટફોલિયો બનાવો", "ઉદ્યોગ જોડાણો સ્થાપિત કરો"],
          skills_to_develop: ["તકનીકી નિપુણતા", "ક્લાયન્ટ સંબંધ વ્યવસ્થાપન"],
          milestones: ["સંબંધિત પ્રમાણપત્ર પૂર્ણ કરો", "ઉદ્યોગ સંમેલનોમાં ભાગ લો"],
          internship_opportunities: "ગુજરાતમાં ઇન્ટર્નશિપ તકો"
        },
        long_term: {
          duration: "1-2 વર્ષ",
          goals: ["વરિષ્ઠ ભૂમિકા સુરક્ષિત કરો", "વિષય નિષ્ણાત બનો"],
          expertise_areas: ["વ્યૂહાત્મક સલાહકાર", "પરિવર્તન વ્યવસ્થાપન"],
          leadership_development: ["ટીમ નેતૃત્વ", "ક્લાયન્ટ સલાહકાર કુશળતા"],
          entrepreneurship_opportunities: "ગુજરાતમાં ઉદ્યોગસાહસિકતા તકો"
        }
      },
      result_analysis: {
        strengths: [
          {
            strength: "વિશ્લેષણાત્મક વિચારશક્તિ",
            reasoning: "સમસ્યા-નિરાકરણ માટે વ્યવસ્થિત અભિગમ દર્શાવે છે",
            career_application: "સલાહકાર અને સલાહકાર ભૂમિકાઓ માટે મૂલ્યવાન"
          }
        ],
        weaknesses: [
          {
            weakness: "સંભવિત વધુ વિશ્લેષણ",
            reasoning: "નિર્ણય લેવામાં વધુ સમય ગાળી શકે છે",
            improvement_strategy: "ઝડપી નિર્ણય લેવાના ફ્રેમવર્કનો અભ્યાસ કરો"
          }
        ]
      },
      career_recommendations: [
        {
          job_role: "Management Consultant",
          industry: "Professional Services",
          explanation: "Matches analytical strengths and advisory capabilities",
          growth_potential: "High",
          salary_range: "$70,000 - $120,000"
        }
      ],
      skill_recommendations: {
        technical_skills: [
          {
            skill: "Data Analysis & Visualization",
            importance: "High",
            learning_resources: ["Tableau Public Training", "Power BI Learning Path"]
          }
        ],
        soft_skills: [
          {
            skill: "Executive Communication",
            importance: "High",
            development_approach: "Join Toastmasters, practice presentations"
          }
        ]
      },
      skill_gaps: [
        {
          gap: "Industry-specific technical tools",
          impact: "May limit immediate job opportunities",
          priority: "High",
          learning_path: "Complete tool-specific certifications (Excel, SQL, Python)"
        }
      ],
      future_plans: {
        "3_year_plan": {
          career_position: "Senior Consultant or Team Lead",
          key_achievements: ["Lead major client engagement", "Develop specialized expertise"],
          skills_mastered: ["Advanced analytics", "Client relationship management"],
          network_goals: "Build strong professional network across target industries"
        },
        "5_year_plan": {
          career_position: "Principal Consultant or Practice Manager",
          expertise_areas: ["Digital transformation", "Organizational change"],
          leadership_role: "Practice area leadership or team management",
          industry_impact: "Recognized thought leader in specialized domain"
        },
        "10_year_plan": {
          career_vision: "Partner-level or independent consulting firm owner",
          legacy_goals: ["Develop innovative methodologies", "Mentor next generation consultants"],
          mentorship_role: "Industry mentor and thought leader",
          entrepreneurial_potential: "High potential for boutique consulting firm"
        }
      },
      daily_habits: [
        {
          habit: "Morning strategic thinking",
          purpose: "Develop strategic mindset and planning skills",
          implementation: "15 minutes of strategic reflection and goal alignment",
          time_required: "15 minutes"
        }
      ],
      certifications: [
        {
          name: "Google Data Analytics Professional Certificate",
          provider: "Google via Coursera",
          direct_enrollment_link: "https://www.coursera.org/professional-certificates/google-data-analytics",
          why_recommended: "Builds essential data analysis skills for modern business roles",
          difficulty_level: "Beginner to Intermediate",
          estimated_duration: "3-6 months",
          gujarat_centers: "ગુજરાતમાં ડેટા એનાલિટિક્સ કેન્દ્રો",
          online_options: "ઓનલાઇન શીખવાના વિકલ્પો"
        }
      ],
      additional_insights: {
        work_environment: "તમારા વ્યક્તિત્વ માટે યોગ્ય કામનું વાતાવરણ",
        team_dynamics: "ટીમમાં કેવી રીતે કામ કરવું",
        stress_management: "તણાવ સંચાલનની તકનીકો",
        work_life_balance: "કામ-જીવન સંતુલન કેવી રીતે જાળવવું",
        gujarat_specific_advice: "ગુજરાતી સંસ્કૃતિ અને વ્યવસાયિક વાતાવરણ માટે ખાસ સલાહ",
        networking_tips: "ગુજરાતમાં વ્યવસાયિક નેટવર્કિંગ ટિપ્સ",
        mentorship_opportunities: "ગુજરાતમાં માર્ગદર્શન તકો"
      }
    };
  }

  getFallbackComprehensiveInsights(): ComprehensiveAIInsights {
    return {
      top_career_fields: [
        {
          field: "Data Science અને Analytics",
          reasoning: "• તમારી વિશ્લેષણાત્મક વિચારશક્તિ અને સમસ્યા નિરાકરણની ક્ષમતા ટેકનોલોજી ક્ષેત્ર માટે આદર્શ છે\n• ગણિત અને આંકડાશાસ્ત્રમાં રુચિ\n• ડેટા પેટર્ન સમજવાની ક્ષમતા",
          gujarat_opportunities: "અમદાવાદ, સુરત અને ગાંધીનગરમાં TCS, Infosys, Wipro અને સ્થાનિક IT કંપનીઓ",
          salary_range: "₹4,00,000 - ₹15,00,000 પ્રતિ વર્ષ",
          growth_potential: "આગામી 5 વર્ષમાં 60-80% વૃદ્ધિની સંભાવના"
        },
        {
          field: "Software Development",
          reasoning: "• તમારી વ્યૂહાત્મક વિચારશક્તિ અને સંચાર કુશળતા બિઝનેસ એનાલિસિસ માટે યોગ્ય છે\n• લોજિકલ થિંકિંગ સ્કિલ્સ મજબૂત છે\n• ટેકનોલોજીમાં રુચિ અને શીખવાની ઇચ્છા",
          gujarat_opportunities: "અમદાવાદ, ગાંધીનગર, સુરતમાં IT પાર્ક્સ અને સ્ટાર્ટઅપ્સમાં તકો",
          salary_range: "₹3,50,000 - ₹12,00,000 પ્રતિ વર્ષ",
          growth_potential: "ઝડપી વૃદ્ધિ અને રિમોટ વર્ક તકો"
        },
        {
          field: "Digital Marketing",
          reasoning: "• તમારી સર્જનાત્મકતા અને ડિજિટલ સમજ માર્કેટિંગ ક્ષેત્ર માટે મૂલ્યવાન છે\n• કમ્યુનિકેશન સ્કિલ્સ સારી છે\n• ટ્રેન્ડ્સ સમજવાની ક્ષમતા",
          gujarat_opportunities: "અમદાવાદ, રાજકોટ, વડોદરામાં મીડિયા એજન્સીઓ અને ઈ-કોમર્સ કંપનીઓમાં તકો",
          salary_range: "₹2,50,000 - ₹8,00,000 પ્રતિ વર્ષ",
          growth_potential: "ફ્રીલાન્સિંગ અને કન્સલ્ટિંગની તકો"
        }
      ],
      career_roadmaps: {
        "Data Science અને Analytics": {
          beginner_phase: {
            duration: "0-2 વર્ષ",
            skills_to_learn: ["Python Programming", "Statistics", "Excel Advanced", "SQL Database"],
            certifications: ["Google Data Analytics", "Python for Data Science"],
            timeline: "8-12 મહિના",
            projects: ["Sales Analysis Dashboard", "Customer Segmentation"]
          },
          intermediate_phase: {
            duration: "2-4 વર્ષ",
            skills_to_learn: ["Machine Learning", "Tableau/Power BI", "Advanced Statistics"],
            certifications: ["AWS Data Analytics", "Tableau Desktop Specialist"],
            timeline: "12-18 મહિના",
            projects: ["Predictive Analytics Model", "Business Intelligence Dashboard"]
          },
          expert_phase: {
            duration: "4+ વર્ષ",
            skills_to_learn: ["Deep Learning", "Big Data Technologies", "Leadership"],
            certifications: ["Google Cloud Data Engineer", "Microsoft Azure Data Scientist"],
            timeline: "18-24 મહિના",
            leadership_roles: ["Data Science Team Lead", "Analytics Manager"]
          }
        },
        "Software Development": {
          beginner_phase: {
            duration: "0-2 વર્ષ",
            skills_to_learn: ["HTML/CSS", "JavaScript", "React/Angular", "Git Version Control"],
            certifications: ["FreeCodeCamp Certificates", "Google IT Support"],
            timeline: "6-10 મહિના",
            projects: ["Personal Portfolio Website", "Todo App", "E-commerce Frontend"]
          },
          intermediate_phase: {
            duration: "2-4 વર્ષ",
            skills_to_learn: ["Node.js/Django", "Database Design", "API Development", "Testing"],
            certifications: ["AWS Developer Associate", "Oracle Java Certification"],
            timeline: "12-15 મહિના",
            projects: ["Full-stack Web Application", "Mobile App", "REST API Service"]
          },
          expert_phase: {
            duration: "4+ વર્ષ",
            skills_to_learn: ["System Design", "DevOps", "Cloud Architecture", "Team Management"],
            certifications: ["AWS Solutions Architect", "Kubernetes Administrator"],
            timeline: "15-20 મહિના",
            leadership_roles: ["Senior Developer", "Tech Lead", "Engineering Manager"]
          }
        },
        "Digital Marketing": {
          beginner_phase: {
            duration: "0-1 વર્ષ",
            skills_to_learn: ["Google Ads", "Facebook Marketing", "Content Writing", "SEO Basics"],
            certifications: ["Google Ads Certification", "Facebook Blueprint"],
            timeline: "4-6 મહિના",
            projects: ["Social Media Campaign", "Blog Content Strategy"]
          },
          intermediate_phase: {
            duration: "1-3 વર્ષ",
            skills_to_learn: ["Analytics Tools", "Email Marketing", "Conversion Optimization"],
            certifications: ["Google Analytics", "HubSpot Content Marketing"],
            timeline: "8-12 મહિના",
            projects: ["Multi-channel Campaign", "Lead Generation Funnel"]
          },
          expert_phase: {
            duration: "3+ વર્ષ",
            skills_to_learn: ["Marketing Automation", "Data Analysis", "Strategy Planning"],
            certifications: ["Google Marketing Platform", "Adobe Certified Expert"],
            timeline: "12-15 મહિના",
            leadership_roles: ["Digital Marketing Manager", "Growth Hacker", "Marketing Director"]
          }
        }
      },
      skills_to_develop: {
        technical_skills: [
          {
            skill: "Programming Languages",
            importance: "ઉચ્ચ",
            learning_path: ["Python/JavaScript Basics", "Data Structures", "Algorithms", "Advanced Concepts"],
            estimated_time: "6-12 મહિના"
          }
        ],
        soft_skills: [
          {
            skill: "Communication Skills",
            importance: "ઉચ્ચ",
            development_approach: "દૈનિક અભ્યાસ અને વ્યવહારિક ઉપયોગ",
            practice_methods: ["Public Speaking", "Writing Practice", "Team Collaboration"]
          }
        ]
      },
      book_recommendations: {
        career_development: [
          {
            title: "Clean Code",
            author: "Robert C. Martin",
            gujarati_title: "સ્વચ્છ કોડ લેખન",
            why_recommended: "પ્રોગ્રામિંગ બેસ્ટ પ્રેક્ટિસ શીખવા માટે",
            key_topics: ["Code Quality", "Best Practices", "Professional Development"],
            difficulty_level: "Intermediate",
            amazon_link: "https://amazon.in/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350884",
            local_availability: "ગુજરાતની મોટી બુકસ્ટોરમાં ઉપલબ્ધ"
          }
        ],
        skill_building: [],
        weakness_improvement: []
      },
      strengths: [
        "• વિશ્લેષણાત્મક વિચારસરણી અને ડેટા સમજવાની ક્ષમતા",
        "• સમસ્યાઓનું ક્રમબદ્ધ નિરાકરણ કરવાની કુશળતા",
        "• નવી ટેકનોલોજી અને ટૂલ્સ શીખવાની ઝડપી ક્ષમતા",
        "• વિગતવાર અને સચોટ કામ કરવાની આદત",
        "• સ્વતંત્ર રીતે કામ કરવાની અને સેલ્ફ-મોટિવેશનની ક્ષમતા",
        "• લોજિકલ અને સ્ટ્રક્ચર્ડ એપ્રોચ અપનાવવાની કુશળતા"
      ],
      weaknesses: [
        "• ટીમ વર્કમાં પ્રારંભિક અવરોધ અને કમ્યુનિકેશન ગેપ",
        "• પબ્લિક સ્પીકિંગ અને પ્રેઝન્ટેશન સ્કિલ્સનો અભાવ",
        "• ડેડલાઇન પ્રેશર હેઠળ સ્ટ્રેસ મેનેજમેન્ટની જરૂર",
        "• નેટવર્કિંગ અને પ્રોફેશનલ રિલેશનશિપ બિલ્ડિંગમાં ધીમાપણું",
        "• મલ્ટિટાસ્કિંગ અને પ્રાયોરિટી સેટિંગમાં સુધારાની જરૂર",
        "• ક્રિએટિવ થિંકિંગ અને આઉટ-ઓફ-બોક્સ સોલ્યુશન્સમાં વિકાસની જરૂર"
      ],
      daily_habits: [
        "• દરરોજ 30 મિનિટ ઓનલાઇન કોર્સ અથવા ટ્યુટોરિયલ જોવું",
        "• સવારે 15 મિનિટ ઇન્ડસ્ટ્રી ન્યૂઝ અને ટ્રેન્ડ્સ વાંચવા",
        "• દરરોજ 45 મિનિટ પ્રેક્ટિકલ પ્રોજેક્ટ અથવા કોડિંગ પ્રેક્ટિસ",
        "• સાંજે 20 મિનિટ LinkedIn પર નેટવર્કિંગ અને પોસ્ટ શેરિંગ",
        "• સપ્તાહમાં 2-3 વાર યોગ અથવા મેડિટેશન સ્ટ્રેસ મેનેજમેન્ટ માટે",
        "• દરરોજ 10 મિનિટ ઇંગ્લિશ કમ્યુનિકેશન સ્કિલ્સ પ્રેક્ટિસ કરવી"
      ],
      recommended_certifications: [
        {
          priority: "ઉચ્ચ",
          certification: {
            name: "Google Data Analytics Professional Certificate",
            direct_enrollment_link: "https://www.coursera.org/professional-certificates/google-data-analytics",
            why_recommended: "ડેટા એનાલિટિક્સ સ્કિલ્સ માટે ઇન્ડસ્ટ્રી માન્યતા પ્રાપ્ત સર્ટિફિકેશન",
            estimated_duration: "3-6 મહિના"
          },
          skills_gained: ["Data Analysis", "SQL", "Tableau", "R Programming"],
          career_impact: "ડેટા એનાલિસ્ટ અને બિઝનેસ એનાલિસ્ટ રોલ્સ માટે યોગ્ય"
        }
      ],
      recommended_books: [
        {
          title: "The 7 Habits of Highly Effective People",
          author: "Stephen Covey",
          why_recommended: "વ્યક્તિત્વ વિકાસ અને કારકિર્દી સફળતા માટે આવશ્યક આદતો શીખવા માટે",
          key_takeaways: ["Be Proactive", "Begin with the End in Mind"],
          relevance_to_career: "કારકિર્દીમાં સફળતા મેળવવા માટે મદદરૂપ"
        },
        {
          title: "Data Science for Dummies",
          author: "Lillian Pierson",
          why_recommended: "ડેટા સાયન્સ શીખવા માટે સરળ અને વ્યાપક માર્ગદર્શન",
          key_takeaways: ["Data Analysis Basics", "Machine Learning Introduction"],
          relevance_to_career: "ડેટા એનાલિસ્ટ તરીકે કારકિર્દી બનાવવા માટે"
        }
      ],
      personality_insights: {
        mbti_analysis: "તમારું વ્યક્તિત્વ વિશ્લેષણાત્મક અને વ્યવસ્થિત છે, જે ડેટા સાયન્સ અને ટેકનોલોજી ક્ષેત્ર માટે આદર્શ છે",
        big_five_summary: "ઉચ્ચ ખુલ્લાપણું નવા અનુભવો માટે તૈયાર અને જિજ્ઞાસુ વ્યક્તિત્વ દર્શાવે છે",
        learning_style: "દૃશ્ય આધારિત શીખવાની શૈલી અને હાથે-હાથ અનુભવ દ્વારા શીખવાની પસંદગી",
        work_environment: "સંરચનાત્મક અને વ્યવસ્થિત વાતાવરણ જ્યાં સ્પષ્ટ લક્ષ્યો અને દિશા હોય",
        leadership_potential: "નેતૃત્વ કરવાની સહજ ક્ષમતા અને ટીમ સાથે કામ કરવાની કુશળતા"
      },
      networking_suggestions: [
        "• Gujarat Technological University (GTU) Alumni Network",
        "• NASSCOM Gujarat Chapter",
        "• LinkedIn પર ડેટા સાયન્સ પ્રોફેશનલ્સ સાથે જોડાવો"
      ],
      skill_development_plan: {
        immediate_focus: ["SQL", "Python Basics"],
        six_month_goals: ["Complete Data Analytics Certification", "Build Portfolio Projects"],
        one_year_vision: "ડેટા એનાલિસ્ટ તરીકે પ્રથમ નોકરી મેળવવી અને ઇન્ડસ્ટ્રીમાં પ્રવેશ કરવો"
      }
    };
  }

  // Helper method to get confidence level styling
  getConfidenceColor(confidence: number): string {
    if (confidence >= 90) return 'text-emerald-600 bg-emerald-50';
    if (confidence >= 80) return 'text-blue-600 bg-blue-50';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }

  // Helper method to get priority styling
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  // Note: Completion status methods moved to completionStatusService
  // Use completionStatusService.getCompletionStatus() instead

  // Get all test results for comprehensive analysis
  async getAllTestResults(userId: string): Promise<ComprehensiveAIRequest> {
    try {
      const response = await api.get(`/api/v1/results_service/all-results/${userId}`);
      return {
        user_id: userId,
        all_test_results: response.data
      };
    } catch (error) {
      console.error('Error fetching all test results:', error);
      throw error;
    }
  }
}

export const aiInsightsService = new AIInsightsService();
