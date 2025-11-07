# Test Results Migration Script

This document explains how to use the `migrate_test_results.py` script to migrate test result configurations from JSON files to the database.

## Overview

The script migrates test result configuration data from JSON files in the `data/` directory to the `test_result_configurations` table in the database. This includes:

- **MBTI**: Personality types and their descriptions
- **Big Five**: Personality dimensions and scoring ranges
- **Intelligence**: Multiple intelligence types and characteristics
- **Decision**: Decision-making styles and recommendations
- **RIASEC**: Interest types and career suggestions
- **VARK**: Learning styles and combinations
- **Life Situation**: Assessment domains and scoring

## Features

- **Incremental Migration**: Only migrates files that have changed since last run
- **Dry Run Mode**: Test migrations without making database changes
- **Error Handling**: Comprehensive error logging and rollback capabilities
- **Progress Tracking**: Detailed statistics and colored console output
- **State Management**: Tracks completed steps and file hashes

## Usage

### Basic Usage

```bash
# Run the migration
python migrate_test_results.py

# Run in dry-run mode (no database changes)
python migrate_test_results.py --dry-run

# Enable verbose logging
python migrate_test_results.py --verbose
```

### Command Line Options

- `--dry-run`: Run migration in dry-run mode without making database changes
- `--verbose` or `-v`: Enable verbose logging for debugging

## File Structure

The script processes the following JSON files from the `data/` directory:

```
data/
├── mbti_test_results.json          # MBTI personality types
├── bigfive_test_results.json       # Big Five personality dimensions
├── intelligence_test_results.json  # Multiple intelligence types
├── decision_test_results.json      # Decision-making styles
├── riasec_test_results.json        # RIASEC interest types
├── vark_test_results.json          # VARK learning styles
└── life_situation_test_results.json # Life situation domains
```

## Database Schema

The script populates the `test_result_configurations` table with the following structure:

```sql
test_result_configurations:
- id (Primary Key)
- test_id (Foreign Key to tests table)
- result_type (e.g., 'personality_type', 'intelligence_type')
- result_code (e.g., 'INTJ', 'linguistic', 'openness')
- result_name_gujarati (Gujarati name/title)
- result_name_english (English name/title)
- description_gujarati (Gujarati description)
- description_english (English description)
- traits (JSON array of characteristics)
- careers (JSON array of career suggestions)
- strengths (JSON array of strengths)
- recommendations (JSON object with recommendations)
- min_score (Minimum score for scoring ranges)
- max_score (Maximum score for scoring ranges)
- is_active (Boolean flag)
- created_at (Timestamp)
- updated_at (Timestamp)
```

## Migration Process

1. **File Hash Check**: Compares current file hash with stored hash
2. **Data Loading**: Loads and validates JSON data
3. **Configuration Processing**: Extracts configuration data for each test type
4. **Database Operations**: Creates or updates configurations
5. **State Tracking**: Updates migration state and file hashes

## Result Types by Test

### MBTI
- `personality_type`: 16 personality types (INTJ, ENFP, etc.)
- `dimension`: E/I, S/N, T/F, J/P dimensions

### Big Five
- `personality_dimension`: openness, conscientiousness, extraversion, agreeableness, neuroticism
- `scoring_range`: veryHigh, high, medium, low, veryLow

### Intelligence
- `intelligence_type`: linguistic, logical, musical, bodily, visual, interpersonal, intrapersonal, naturalistic, existential

### Decision
- `decision_style`: rational, intuitive, dependent, avoidant, spontaneous
- `scoring_range`: dominant, moderate, low

### RIASEC
- `interest_type`: realistic, investigative, artistic, social, enterprising, conventional

### VARK
- `learning_style`: visual, auditory, readwrite, kinesthetic

### Life Situation
- `life_domain`: family, education, career, financial, health

## Logs and State Files

The script creates the following files:

- `test_results_migration.log`: Detailed migration log
- `test_results_migration_state.json`: Migration state tracking

## Error Handling

- **File Not Found**: Logs warning and continues with other files
- **JSON Parse Error**: Logs error and skips file
- **Database Error**: Rolls back transaction and logs error
- **Validation Error**: Logs error and continues with next item

## Example Output

```
2025-09-23 18:21:49 - INFO - Starting test results configuration migration...
2025-09-23 18:21:49 - INFO - Starting MBTI results migration...
2025-09-23 18:21:49 - INFO - Successfully loaded mbti_test_results.json
2025-09-23 18:21:49 - INFO - Created personality_type: INTJ
2025-09-23 18:21:49 - INFO - Created personality_type: ENFP
...
2025-09-23 18:21:50 - INFO - MBTI results migration completed successfully
============================================================
TEST RESULTS MIGRATION COMPLETED SUCCESSFULLY!
Duration: 0:00:01.234567
Configurations created: 45
Configurations updated: 12
Configurations skipped: 3
============================================================
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure database is running and accessible
   - Check database credentials in core/database.py

2. **File Permission Error**
   - Ensure read permissions on JSON files
   - Ensure write permissions for log files

3. **JSON Parse Error**
   - Validate JSON syntax in data files
   - Check for encoding issues (should be UTF-8)

4. **Migration State Issues**
   - Delete `test_results_migration_state.json` to force re-migration
   - Use `--dry-run` to test without state changes

### Debugging

Use the `--verbose` flag to enable detailed logging:

```bash
python migrate_test_results.py --verbose --dry-run
```

This will show detailed information about each step of the migration process.

## Integration

This script is designed to work alongside the existing `migrate_from_json.py` script:

1. Run `migrate_from_json.py` first to migrate tests, questions, and options
2. Run `migrate_test_results.py` to migrate test result configurations

Both scripts maintain separate state files and can be run independently.
