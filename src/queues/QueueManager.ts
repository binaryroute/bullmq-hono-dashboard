import { type Processor, Queue, QueueEvents, Worker } from "bullmq";
import {
	defaultQueueOptions,
	defaultWorkerOptions,
	QUEUES,
	type QueueName,
	redisConnection,
} from "./config.js";

/**
 * Standard result interface for job processors
 */
export interface JobResult {
	success: boolean;
	processedCount?: number;
	errors?: string[];
	metadata?: Record<string, unknown>;
}

/**
 * Centralized manager for BullMQ queues and workers
 *
 * Responsibilities:
 * - Create and cache queue instances
 * - Register workers with automatic logging
 * - Schedule one-time and repeatable jobs
 * - Collect queue statistics
 * - Handle graceful shutdown
 */
export class QueueManager {
	private queues: Map<string, Queue> = new Map();
	private workers: Map<string, Worker> = new Map();
	private queueEvents: Map<string, QueueEvents> = new Map();

	/**
	 * Get or create a queue by name
	 */
	getQueue(name: QueueName): Queue {
		if (!this.queues.has(name)) {
			const queue = new Queue(name, defaultQueueOptions);
			this.queues.set(name, queue);
			this.setupQueueEvents(name);
			console.log(`Queue created: ${name}`);
		}
		return this.queues.get(name)!;
	}

	/**
	 * Register a worker for a queue with automatic logging
	 */
	registerWorker<TData = unknown, TResult = JobResult>(
		queueName: QueueName,
		processor: Processor<TData, TResult>,
		options?: Partial<typeof defaultWorkerOptions>,
	): Worker<TData, TResult> {
		// Wrap processor with logging
		const wrappedProcessor: Processor<TData, TResult> = async (job) => {
			const startTime = Date.now();
			console.log(
				`Job starting: ${job.name} (id: ${job.id}, attempt: ${job.attemptsMade + 1})`,
			);

			try {
				const result = await processor(job, job.token);
				const duration = Date.now() - startTime;
				console.log(
					`Job completed: ${job.name} (id: ${job.id}, duration: ${duration}ms)`,
				);
				return result;
			} catch (error) {
				const duration = Date.now() - startTime;
				console.error(
					`Job failed: ${job.name} (id: ${job.id}, duration: ${duration}ms)`,
					error,
				);
				throw error;
			}
		};

		const worker = new Worker<TData, TResult>(queueName, wrappedProcessor, {
			...defaultWorkerOptions,
			...options,
		});

		// Log permanent failures
		worker.on("failed", (job, error) => {
			if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
				console.error(
					`Job permanently failed: ${job.name} after ${job.attemptsMade} attempts`,
					error,
				);
			}
		});

		worker.on("error", (error) => {
			console.error(`Worker error on ${queueName}:`, error);
		});

		this.workers.set(queueName, worker);
		console.log(`Worker registered for: ${queueName}`);

		return worker;
	}

	/**
	 * Setup event listeners for monitoring
	 */
	private setupQueueEvents(name: string): void {
		const events = new QueueEvents(name, { connection: redisConnection });

		events.on("completed", ({ jobId }) => {
			console.debug(`Job completed: ${name}/${jobId}`);
		});

		events.on("failed", ({ jobId, failedReason }) => {
			console.warn(`Job failed: ${name}/${jobId}`, failedReason);
		});

		events.on("stalled", ({ jobId }) => {
			console.warn(`Job stalled: ${name}/${jobId}`);
		});

		this.queueEvents.set(name, events);
	}

	/**
	 * Add a repeatable job with cron pattern
	 */
	async addRepeatableJob<TData>(
		queueName: QueueName,
		jobName: string,
		data: TData,
		pattern: string,
		options?: { timezone?: string; immediately?: boolean },
	): Promise<void> {
		const queue = this.getQueue(queueName);

		// Prevent duplicate repeatable jobs
		const existingJobs = await queue.getRepeatableJobs();
		const exists = existingJobs.some((j) => j.name === jobName);

		if (!exists) {
			await queue.add(jobName, data, {
				repeat: {
					pattern,
					tz: options?.timezone,
				},
			});
			console.log(`Repeatable job added: ${jobName} (pattern: ${pattern})`);
		}

		// Optionally run immediately
		if (options?.immediately) {
			await queue.add(jobName, data, {
				jobId: `${jobName}-immediate-${Date.now()}`,
			});
		}
	}

	/**
	 * Add a one-time job
	 */
	async addJob<TData>(
		queueName: QueueName,
		jobName: string,
		data: TData,
		options?: {
			delay?: number;
			priority?: number;
			attempts?: number;
			jobId?: string;
		},
	): Promise<string> {
		const queue = this.getQueue(queueName);
		const job = await queue.add(jobName, data, options);
		console.log(`Job added: ${jobName} (id: ${job.id})`);
		return job.id!;
	}

	/**
	 * Get statistics for a queue
	 */
	async getQueueStats(queueName: QueueName) {
		const queue = this.getQueue(queueName);
		const [waiting, active, completed, failed, delayed, paused] =
			await Promise.all([
				queue.getWaitingCount(),
				queue.getActiveCount(),
				queue.getCompletedCount(),
				queue.getFailedCount(),
				queue.getDelayedCount(),
				queue.isPaused(),
			]);

		return { waiting, active, completed, failed, delayed, paused };
	}

	/**
	 * Get stats for all queues
	 */
	async getAllStats() {
		const stats: Record<
			string,
			Awaited<ReturnType<typeof this.getQueueStats>>
		> = {};
		for (const queueName of Object.values(QUEUES)) {
			stats[queueName] = await this.getQueueStats(queueName);
		}
		return stats;
	}

	/**
	 * Get all queues for Bull Board
	 */
	getAllQueues(): Queue[] {
		// Ensure all queues exist
		for (const queueName of Object.values(QUEUES)) {
			this.getQueue(queueName);
		}
		return Array.from(this.queues.values());
	}

	/**
	 * Graceful shutdown
	 */
	async shutdown(): Promise<void> {
		console.log("Shutting down queue manager...");

		// Close workers first
		for (const [name, worker] of this.workers) {
			await worker.close();
			console.log(`Worker closed: ${name}`);
		}

		// Close queue events
		for (const [name, events] of this.queueEvents) {
			await events.close();
			console.log(`Queue events closed: ${name}`);
		}

		// Close queues
		for (const [name, queue] of this.queues) {
			await queue.close();
			console.log(`Queue closed: ${name}`);
		}

		console.log("Queue manager shutdown complete");
	}
}

// Singleton instance
export const queueManager = new QueueManager();
