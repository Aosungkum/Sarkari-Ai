"""
Excel to JavaScript Data Scraper for SarkariAlert
This script reads job data from Excel and generates jobs-data.js file
"""

import pandas as pd
import json
from datetime import datetime

def normalize_state(state):
    """Normalize state names to match filter values"""
    state_mapping = {
        'nagaland': 'nagaland',
        'assam': 'assam',
        'manipur': 'manipur',
        'meghalaya': 'meghalaya',
        'mizoram': 'mizoram',
        'tripura': 'tripura',
        'arunachal pradesh': 'arunachal',
        'sikkim': 'sikkim',
        'all india': 'all-india',
        'india': 'all-india',
        'pan india': 'all-india'
    }
    
    state_lower = str(state).lower().strip()
    return state_mapping.get(state_lower, 'all-india')

def normalize_qualification(qual):
    """Normalize qualification to match filter values"""
    qual_mapping = {
        '10th': '10th',
        '10th pass': '10th',
        'matriculation': '10th',
        '12th': '12th',
        '12th pass': '12th',
        'intermediate': '12th',
        'graduate': 'graduate',
        'graduation': 'graduate',
        'bachelor': 'graduate',
        'post graduate': 'postgraduate',
        'postgraduate': 'postgraduate',
        'master': 'postgraduate',
        'diploma': 'diploma',
        'iti': 'diploma'
    }
    
    qual_lower = str(qual).lower().strip()
    for key, value in qual_mapping.items():
        if key in qual_lower:
            return value
    return 'graduate'

def normalize_category(cat):
    """Normalize category to match filter values"""
    cat_mapping = {
        'bank': 'banking',
        'banking': 'banking',
        'railway': 'railway',
        'rrb': 'railway',
        'defense': 'defense',
        'defence': 'defense',
        'army': 'defense',
        'navy': 'defense',
        'air force': 'defense',
        'teaching': 'teaching',
        'teacher': 'teaching',
        'tet': 'teaching',
        'police': 'police',
        'constable': 'police',
        'psc': 'psc',
        'public service': 'psc',
        'ssc': 'ssc',
        'upsc': 'upsc',
        'civil service': 'upsc'
    }
    
    cat_lower = str(cat).lower().strip()
    for key, value in cat_mapping.items():
        if key in cat_lower:
            return value
    return 'psc'

def determine_section(state, category, is_urgent):
    """Determine which section the job should appear in"""
    if is_urgent:
        return 'closing'
    elif state in ['nagaland', 'assam', 'manipur', 'meghalaya', 'mizoram', 'tripura', 'arunachal', 'sikkim']:
        return 'northeast'
    elif category in ['banking', 'upsc', 'defense']:
        return 'featured'
    else:
        return 'all-india'

def determine_tag(state, category, is_urgent):
    """Determine tag for the job"""
    if is_urgent:
        return 'Urgent'
    elif state in ['nagaland', 'assam', 'manipur', 'meghalaya', 'mizoram', 'tripura', 'arunachal', 'sikkim']:
        return 'Northeast'
    elif category in ['banking', 'defense', 'railway']:
        return 'Hot'
    else:
        return 'New'

def is_closing_soon(last_date):
    """Check if job is closing within 10 days"""
    try:
        if pd.isna(last_date):
            return False
        
        if isinstance(last_date, str):
            # Try multiple date formats
            for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%m/%d/%Y']:
                try:
                    last_date = datetime.strptime(last_date, fmt)
                    break
                except:
                    continue
        
        if isinstance(last_date, datetime):
            days_left = (last_date - datetime.now()).days
            return days_left <= 10
    except:
        pass
    return False

def format_date(date_value):
    """Format date to YYYY-MM-DD"""
    try:
        if pd.isna(date_value):
            return "2026-01-31"
        
        if isinstance(date_value, str):
            for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%m/%d/%Y']:
                try:
                    date_obj = datetime.strptime(date_value, fmt)
                    return date_obj.strftime('%Y-%m-%d')
                except:
                    continue
        
        if isinstance(date_value, datetime):
            return date_value.strftime('%Y-%m-%d')
        
        return str(date_value)
    except:
        return "2026-01-31"

def scrape_excel_to_js(excel_file='SarkariAlert_JobData2 6.xlsx', output_file='jobs-data.js'):
    """
    Main function to scrape Excel and generate JavaScript file
    
    Expected Excel columns:
    - Title / Job Title
    - Organization / Department
    - Posts / Vacancies
    - Last Date / Closing Date
    - State / Location
    - Qualification / Educational Qualification
    - Category / Type
    - Age Limit
    - Salary / Pay Scale
    - Application Fee
    - Eligibility / Eligibility Criteria
    - Syllabus
    - Exam Pattern
    - Apply Link / Application Link
    - Official Website
    """
    
    try:
        # Read Excel file
        print(f"📖 Reading Excel file: {excel_file}")
        df = pd.read_excel(excel_file)
        
        print(f"✅ Found {len(df)} rows in Excel")
        print(f"📋 Columns: {df.columns.tolist()}")
        
        # Normalize column names (case-insensitive)
        df.columns = df.columns.str.strip().str.lower()
        
        # Map possible column name variations
        column_mapping = {
            'title': ['title', 'job title', 'job_title', 'post name', 'post'],
            'organization': ['organization', 'organisation', 'department', 'company'],
            'posts': ['posts', 'vacancies', 'vacancy', 'no of posts', 'total posts'],
            'lastDate': ['last date', 'closing date', 'end date', 'deadline'],
            'state': ['state', 'location', 'place', 'region'],
            'qualification': ['qualification', 'educational qualification', 'eligibility', 'education'],
            'category': ['category', 'type', 'sector', 'department type'],
            'ageLimit': ['age limit', 'age', 'age criteria'],
            'salary': ['salary', 'pay scale', 'pay', 'remuneration'],
            'applicationFee': ['application fee', 'fee', 'registration fee'],
            'eligibilityCriteria': ['eligibility criteria', 'eligibility', 'requirements'],
            'syllabus': ['syllabus', 'exam syllabus', 'subjects'],
            'examPattern': ['exam pattern', 'selection process', 'process'],
            'applyLink': ['apply link', 'application link', 'registration link', 'link'],
            'officialWebsite': ['official website', 'website', 'portal']
        }
        
        # Find actual column names in the dataframe
        actual_columns = {}
        for key, variations in column_mapping.items():
            for col in df.columns:
                if any(var in col for var in variations):
                    actual_columns[key] = col
                    break
            if key not in actual_columns:
                actual_columns[key] = None
        
        print(f"🔍 Mapped columns: {actual_columns}")
        
        # Generate JavaScript data
        jobs_list = []
        
        for idx, row in df.iterrows():
            try:
                # Extract data with fallbacks
                title = str(row.get(actual_columns['title'], f'Job Opportunity {idx+1}')).strip() if actual_columns['title'] else f'Job Opportunity {idx+1}'
                organization = str(row.get(actual_columns['organization'], 'Government of India')).strip() if actual_columns['organization'] else 'Government of India'
                posts = int(row.get(actual_columns['posts'], 100)) if actual_columns['posts'] and pd.notna(row.get(actual_columns['posts'])) else 100
                
                last_date = format_date(row.get(actual_columns['lastDate'])) if actual_columns['lastDate'] else '2026-01-31'
                
                state_raw = str(row.get(actual_columns['state'], 'All India')).strip() if actual_columns['state'] else 'All India'
                state = normalize_state(state_raw)
                
                qual_raw = str(row.get(actual_columns['qualification'], 'Graduate')).strip() if actual_columns['qualification'] else 'Graduate'
                qualification = normalize_qualification(qual_raw)
                
                cat_raw = str(row.get(actual_columns['category'], 'PSC')).strip() if actual_columns['category'] else 'PSC'
                category = normalize_category(cat_raw)
                
                age_limit = str(row.get(actual_columns['ageLimit'], '18-35 years')).strip() if actual_columns['ageLimit'] else '18-35 years'
                salary = str(row.get(actual_columns['salary'], '₹20,000 - ₹50,000')).strip() if actual_columns['salary'] else '₹20,000 - ₹50,000'
                app_fee = str(row.get(actual_columns['applicationFee'], '₹500')).strip() if actual_columns['applicationFee'] else '₹500'
                eligibility = str(row.get(actual_columns['eligibilityCriteria'], 'As per notification')).strip() if actual_columns['eligibilityCriteria'] else 'As per notification'
                syllabus = str(row.get(actual_columns['syllabus'], 'As per official notification')).strip() if actual_columns['syllabus'] else 'As per official notification'
                exam_pattern = str(row.get(actual_columns['examPattern'], 'Written Test + Interview')).strip() if actual_columns['examPattern'] else 'Written Test + Interview'
                apply_link = str(row.get(actual_columns['applyLink'], 'https://example.com')).strip() if actual_columns['applyLink'] else 'https://example.com'
                website = str(row.get(actual_columns['officialWebsite'], apply_link)).strip() if actual_columns['officialWebsite'] else apply_link
                
                is_urgent = is_closing_soon(row.get(actual_columns['lastDate'])) if actual_columns['lastDate'] else False
                section = determine_section(state, category, is_urgent)
                tag = determine_tag(state, category, is_urgent)
                
                job_obj = {
                    'id': idx + 1,
                    'title': title,
                    'organization': organization,
                    'posts': posts,
                    'lastDate': last_date,
                    'state': state,
                    'qualification': qualification,
                    'category': category,
                    'ageLimit': age_limit,
                    'salary': salary,
                    'applicationFee': app_fee,
                    'eligibilityCriteria': eligibility,
                    'syllabus': syllabus,
                    'examPattern': exam_pattern,
                    'importantDates': {
                        'notification': format_date(datetime.now() - pd.Timedelta(days=15)),
                        'startDate': format_date(datetime.now() - pd.Timedelta(days=10)),
                        'lastDate': last_date,
                        'examDate': format_date(datetime.now() + pd.Timedelta(days=45))
                    },
                    'applyLink': apply_link,
                    'officialWebsite': website,
                    'tag': tag,
                    'isUrgent': is_urgent,
                    'section': section
                }
                
                jobs_list.append(job_obj)
                
            except Exception as e:
                print(f"⚠️ Error processing row {idx+1}: {str(e)}")
                continue
        
        # Generate JavaScript file
        js_content = f"""// jobs-data.js
// This file is auto-generated from Excel by excel-to-js-scraper.py
// Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

const jobsDatabase = {json.dumps(jobs_list, indent=4, ensure_ascii=False)};

// Export the data
if (typeof module !== 'undefined' && module.exports) {{
    module.exports = {{ jobsDatabase }};
}}
"""
        
        # Write to file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(js_content)
        
        print(f"\n✅ Successfully generated {output_file}")
        print(f"📊 Total jobs processed: {len(jobs_list)}")
        print(f"📍 Northeast jobs: {len([j for j in jobs_list if j['section'] == 'northeast'])}")
        print(f"🔥 Featured jobs: {len([j for j in jobs_list if j['section'] == 'featured'])}")
        print(f"🌏 All India jobs: {len([j for j in jobs_list if j['section'] == 'all-india'])}")
        print(f"⏰ Closing soon: {len([j for j in jobs_list if j['isUrgent']])}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    # Run the scraper
    print("🚀 Starting SarkariAlert Excel Scraper...")
    print("=" * 60)
    
    success = scrape_excel_to_js(
        excel_file='SarkariAlert_JobData2 6.xlsx',
        output_file='jobs-data.js'
    )
    
    if success:
        print("\n✨ Done! Your jobs-data.js file is ready.")
        print("📝 Next steps:")
        print("   1. Place jobs-data.js in the same folder as index.html")
        print("   2. Open index.html in browser")
        print("   3. Jobs will load automatically from Excel data")
    else:
        print("\n❌ Scraping failed. Please check the error messages above.")