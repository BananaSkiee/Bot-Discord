const fs = require('fs');
const path = require('path');

class VerifyDatabase {
    constructor() {
        this.dataPath = path.join(__dirname, '../data/verifications.json');
        this.ensureDataFile();
    }

    ensureDataFile() {
        const dir = path.dirname(this.dataPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        if (!fs.existsSync(this.dataPath)) {
            fs.writeFileSync(this.dataPath, JSON.stringify({
                verifications: [],
                analytics: {
                    totalVerifications: 0,
                    onboardingCompleted: 0,
                    quickAccess: 0,
                    averageRating: 0,
                    lastUpdated: new Date().toISOString()
                }
            }, null, 2));
        }
    }

    async logVerification(verificationData) {
        try {
            const data = this.readData();
            
            // Add verification record
            data.verifications.push({
                id: this.generateId(),
                timestamp: verificationData.timestamp.toISOString(),
                ...verificationData
            });

            // Update analytics
            data.analytics.totalVerifications++;
            
            if (verificationData.type === 'ONBOARDING_COMPLETE') {
                data.analytics.onboardingCompleted++;
            } else if (verificationData.type === 'QUICK_ACCESS') {
                data.analytics.quickAccess++;
            }

            if (verificationData.data?.rating) {
                const ratings = data.verifications
                    .filter(v => v.data?.rating)
                    .map(v => v.data.rating);
                
                data.analytics.averageRating = ratings.length > 0 
                    ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)
                    : 0;
            }

            data.analytics.lastUpdated = new Date().toISOString();

            this.writeData(data);
            
        } catch (error) {
            console.error('Database logging error:', error);
        }
    }

    getAnalytics() {
        try {
            const data = this.readData();
            return data.analytics;
        } catch (error) {
            console.error('Analytics retrieval error:', error);
            return {};
        }
    }

    getRecentVerifications(limit = 10) {
        try {
            const data = this.readData();
            return data.verifications
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
        } catch (error) {
            console.error('Recent verifications error:', error);
            return [];
        }
    }

    // Helper methods
    readData() {
        try {
            const rawData = fs.readFileSync(this.dataPath, 'utf8');
            return JSON.parse(rawData);
        } catch (error) {
            console.error('Data read error:', error);
            return { verifications: [], analytics: {} };
        }
    }

    writeData(data) {
        try {
            fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Data write error:', error);
        }
    }

    generateId() {
        return `VER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Backup and maintenance
    async backupData() {
        try {
            const data = this.readData();
            const backupPath = this.dataPath + '.backup_' + Date.now();
            fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
            console.log('✅ Verification data backed up:', backupPath);
        } catch (error) {
            console.error('Backup error:', error);
        }
    }

    async cleanupOldData(days = 30) {
        try {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);
            
            const data = this.readData();
            const originalCount = data.verifications.length;
            
            data.verifications = data.verifications.filter(
                v => new Date(v.timestamp) > cutoff
            );
            
            this.writeData(data);
            
            console.log(`✅ Cleaned up ${originalCount - data.verifications.length} old records`);
            
        } catch (error) {
            console.error('Data cleanup error:', error);
        }
    }
}

module.exports = VerifyDatabase;
