class PerformanceMonitor {
    constructor() {
        this.metrics = {
            dataLoading: {},
            rendering: {},
            interactions: {}
        };
    }

    startTimer(category, name) {
        if (!this.metrics[category]) {
            this.metrics[category] = {};
        }
        this.metrics[category][name] = {
            start: performance.now(),
            counts: 0
        };
    }

    endTimer(category, name) {
        if (this.metrics[category]?.[name]) {
            const end = performance.now();
            const duration = end - this.metrics[category][name].start;
            this.metrics[category][name].duration = duration;
            this.metrics[category][name].counts += 1;
            return duration;
        }
        return 0;
    }

    logMetrics(category, name) {
        const metric = this.metrics[category]?.[name];
        if (metric) {
            console.log(`Performance [${category}] ${name}:`, {
                duration: `${metric.duration.toFixed(2)}ms`,
                counts: metric.counts,
                avgDuration: `${(metric.duration / Math.max(1, metric.counts)).toFixed(2)}ms`
            });
        }
    }
}

export const performanceMonitor = new PerformanceMonitor();
