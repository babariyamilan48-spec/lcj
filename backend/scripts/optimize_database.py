"""
Database Optimization Script
Adds indexes and optimizes database schema for maximum performance
"""
import asyncio
import logging
import sys
import os
from sqlalchemy import text, create_engine
from sqlalchemy.orm import sessionmaker

# Add the parent directory to Python path so we can import from core
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.database_fixed import get_db_session as get_db
from core.config.settings import settings

logger = logging.getLogger(__name__)

class DatabaseOptimizer:
    """Database optimization utilities"""
    
    def __init__(self):
        self.engine = None
        self.session = None
        self._setup_connection()
    
    def _setup_connection(self):
        """Setup database connection"""
        try:
            database_url = settings.DATABASE_URL
            self.engine = create_engine(database_url, echo=False)
            SessionLocal = sessionmaker(bind=self.engine)
            self.session = SessionLocal()
            logger.info("Database connection established for optimization")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
    
    def create_performance_indexes(self):
        """Create indexes for optimal query performance"""
        indexes = [
            # Test results table indexes (note: table is 'test_results' plural)
            {
                'name': 'idx_test_results_user_id_completed',
                'table': 'test_results',
                'columns': 'user_id, is_completed',
                'description': 'Optimize user results queries'
            },
            {
                'name': 'idx_test_results_user_test_created',
                'table': 'test_results',
                'columns': 'user_id, test_id, created_at DESC',
                'description': 'Optimize user-test queries with ordering'
            },
            {
                'name': 'idx_test_results_created_at',
                'table': 'test_results',
                'columns': 'created_at DESC',
                'description': 'Optimize time-based queries'
            },
            {
                'name': 'idx_test_results_test_id',
                'table': 'test_results',
                'columns': 'test_id',
                'description': 'Optimize test-specific queries'
            },
            {
                'name': 'idx_test_results_completed_at',
                'table': 'test_results',
                'columns': 'completed_at DESC',
                'description': 'Optimize completion time queries'
            },
            
            # AI insights table indexes
            {
                'name': 'idx_ai_insights_user_id',
                'table': 'ai_insights',
                'columns': 'user_id',
                'description': 'Optimize AI insights user queries'
            },
            {
                'name': 'idx_ai_insights_type_user',
                'table': 'ai_insights',
                'columns': 'insight_type, user_id',
                'description': 'Optimize AI insights type queries'
            },
            
            # User profile indexes (if exists)
            {
                'name': 'idx_user_profile_user_id',
                'table': 'user_profile',
                'columns': 'user_id',
                'description': 'Optimize user profile queries'
            }
        ]
        
        created_count = 0
        for index in indexes:
            try:
                # Check if index already exists
                check_query = text(f"""
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = '{index['name']}'
                """)
                
                result = self.session.execute(check_query).fetchone()
                
                if not result:
                    # Create index without CONCURRENTLY to avoid transaction issues
                    create_query = text(f"""
                        CREATE INDEX IF NOT EXISTS {index['name']} 
                        ON {index['table']} ({index['columns']})
                    """)
                    
                    self.session.execute(create_query)
                    self.session.commit()
                    
                    logger.info(f"✅ Created index: {index['name']} - {index['description']}")
                    created_count += 1
                else:
                    logger.info(f"⏭️  Index already exists: {index['name']}")
                    
            except Exception as e:
                logger.error(f"❌ Failed to create index {index['name']}: {e}")
                self.session.rollback()
        
        logger.info(f"Database optimization completed. Created {created_count} new indexes.")
        return created_count
    
    def analyze_table_statistics(self):
        """Update table statistics for query optimizer"""
        tables = ['test_results', 'ai_insights', 'users']  # Fixed table names
        
        for table in tables:
            try:
                analyze_query = text(f"ANALYZE {table}")
                self.session.execute(analyze_query)
                logger.info(f"✅ Analyzed table: {table}")
            except Exception as e:
                logger.error(f"❌ Failed to analyze table {table}: {e}")
        
        self.session.commit()
    
    def optimize_database_settings(self):
        """Optimize database configuration settings"""
        optimizations = [
            {
                'setting': 'shared_preload_libraries',
                'value': 'pg_stat_statements',
                'description': 'Enable query statistics'
            },
            {
                'setting': 'effective_cache_size',
                'value': '1GB',
                'description': 'Set effective cache size'
            },
            {
                'setting': 'random_page_cost',
                'value': '1.1',
                'description': 'Optimize for SSD storage'
            }
        ]
        
        logger.info("Database setting optimizations (manual configuration required):")
        for opt in optimizations:
            logger.info(f"  {opt['setting']} = {opt['value']} -- {opt['description']}")
    
    def create_materialized_views(self):
        """Create materialized views for frequently accessed data"""
        views = [
            {
                'name': 'mv_user_test_summary',
                'query': '''
                    SELECT 
                        user_id,
                        COUNT(*) as total_tests,
                        COUNT(DISTINCT test_id) as unique_tests,
                        AVG(completion_percentage) as avg_score,
                        MAX(created_at) as last_test_date,
                        MIN(created_at) as first_test_date
                    FROM test_results 
                    WHERE is_completed = true
                    GROUP BY user_id
                ''',
                'description': 'User test summary statistics'
            },
            {
                'name': 'mv_test_popularity',
                'query': '''
                    SELECT 
                        test_id,
                        COUNT(*) as completion_count,
                        AVG(completion_percentage) as avg_score,
                        AVG(time_taken_seconds) as avg_duration,
                        MAX(created_at) as last_completion
                    FROM test_results 
                    WHERE is_completed = true
                    GROUP BY test_id
                ''',
                'description': 'Test popularity and performance metrics'
            }
        ]
        
        created_count = 0
        for view in views:
            try:
                # Drop existing view if exists
                drop_query = text(f"DROP MATERIALIZED VIEW IF EXISTS {view['name']}")
                self.session.execute(drop_query)
                
                # Create materialized view
                create_query = text(f"""
                    CREATE MATERIALIZED VIEW {view['name']} AS
                    {view['query']}
                """)
                
                self.session.execute(create_query)
                
                # Create index on materialized view
                if 'user_id' in view['query']:
                    index_query = text(f"""
                        CREATE INDEX idx_{view['name']}_user_id 
                        ON {view['name']} (user_id)
                    """)
                    self.session.execute(index_query)
                
                self.session.commit()
                logger.info(f"✅ Created materialized view: {view['name']} - {view['description']}")
                created_count += 1
                
            except Exception as e:
                logger.error(f"❌ Failed to create materialized view {view['name']}: {e}")
                self.session.rollback()
        
        return created_count
    
    def vacuum_and_reindex(self):
        """Perform database maintenance"""
        try:
            # Use correct table names and skip VACUUM (requires autocommit)
            maintenance_queries = [
                "REINDEX TABLE test_results",
                "REINDEX TABLE ai_insights"
            ]
            
            for query in maintenance_queries:
                try:
                    self.session.execute(text(query))
                    logger.info(f"✅ Executed: {query}")
                except Exception as e:
                    logger.warning(f"⚠️  Maintenance query failed: {query} - {e}")
            
            self.session.commit()
            logger.info("ℹ️  Note: VACUUM operations skipped (require autocommit mode)")
            
        except Exception as e:
            logger.error(f"❌ Database maintenance failed: {e}")
            self.session.rollback()
    
    def performance_report(self):
        """Generate performance analysis report"""
        try:
            # Query performance statistics
            queries = [
                {
                    'name': 'Table sizes',
                    'query': '''
                        SELECT 
                            schemaname,
                            tablename,
                            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                            pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
                        FROM pg_tables 
                        WHERE schemaname = 'public'
                        ORDER BY size_bytes DESC
                    '''
                },
                {
                    'name': 'Index usage',
                    'query': '''
                        SELECT 
                            schemaname,
                            relname as tablename,
                            indexrelname as indexname,
                            idx_tup_read,
                            idx_tup_fetch
                        FROM pg_stat_user_indexes
                        ORDER BY idx_tup_read DESC
                        LIMIT 10
                    '''
                },
                {
                    'name': 'Slow queries (if pg_stat_statements enabled)',
                    'query': '''
                        SELECT 
                            query,
                            calls,
                            total_time,
                            mean_time,
                            rows
                        FROM pg_stat_statements
                        WHERE query LIKE '%test_results%'
                        ORDER BY mean_time DESC
                        LIMIT 5
                    '''
                }
            ]
            
            report = {"database_performance_report": {}}
            
            for query_info in queries:
                try:
                    result = self.session.execute(text(query_info['query'])).fetchall()
                    report["database_performance_report"][query_info['name']] = [
                        dict(row._mapping) for row in result
                    ]
                except Exception as e:
                    report["database_performance_report"][query_info['name']] = f"Error: {e}"
            
            return report
            
        except Exception as e:
            logger.error(f"❌ Performance report failed: {e}")
            return {"error": str(e)}
    
    def close(self):
        """Close database connection"""
        if self.session:
            self.session.close()
        if self.engine:
            self.engine.dispose()

async def main():
    """Main optimization function"""
    logger.info("🚀 Starting database optimization...")
    
    optimizer = DatabaseOptimizer()
    
    try:
        # Step 1: Create performance indexes
        logger.info("📊 Creating performance indexes...")
        indexes_created = optimizer.create_performance_indexes()
        
        # Step 2: Update table statistics
        logger.info("📈 Updating table statistics...")
        optimizer.analyze_table_statistics()
        
        # Step 3: Create materialized views
        logger.info("🔍 Creating materialized views...")
        views_created = optimizer.create_materialized_views()
        
        # Step 4: Database maintenance
        logger.info("🧹 Performing database maintenance...")
        optimizer.vacuum_and_reindex()
        
        # Step 5: Generate performance report
        logger.info("📋 Generating performance report...")
        report = optimizer.performance_report()
        
        # Step 6: Show optimization recommendations
        optimizer.optimize_database_settings()
        
        logger.info("✅ Database optimization completed successfully!")
        logger.info(f"   - Created {indexes_created} new indexes")
        logger.info(f"   - Created {views_created} materialized views")
        logger.info(f"   - Updated table statistics")
        logger.info(f"   - Performed maintenance tasks")
        
        return {
            "status": "success",
            "indexes_created": indexes_created,
            "views_created": views_created,
            "performance_report": report
        }
        
    except Exception as e:
        logger.error(f"❌ Database optimization failed: {e}")
        return {"status": "error", "error": str(e)}
    
    finally:
        optimizer.close()

if __name__ == "__main__":
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run optimization
    result = asyncio.run(main())
    print(f"\nOptimization Result: {result}")
