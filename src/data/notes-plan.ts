/**
 * Java 面试笔记 · 路线图
 *
 * 与「P0 / P1 十四天复习计划」一一对应：章 → 节 → 篇 三级。
 * dir 必须与 src/content/notes/ 下的真实目录同名；planned 是篇文件名（不含 .md）。
 * 已写的篇目由 src/content/notes 集合自动匹配，未写的显示为待写，因此空目录不需要真实存在。
 */

export interface NoteGroup {
	/** 节目录名，空字符串表示该章下不再分节 */
	dir: string;
	planned: string[];
}

export interface NoteChapter {
	/** 章目录名，与 src/content/notes 下一级目录同名 */
	dir: string;
	/** 对应学习计划的天次 */
	day: string;
	stage: 'P0' | 'P1';
	/** 这一章要解决什么 */
	goal: string;
	groups: NoteGroup[];
}

export const noteChapters: NoteChapter[] = [
	{
		dir: '01-Java基础',
		day: 'D1',
		stage: 'P0',
		goal: 'Java 基础、OOP、泛型、反射、注解、异常、String 家族——所有 Java 岗位的隐含必考项，8 家里 3 家明写。',
		groups: [
			{ dir: '01-泛型', planned: ['01-从getClass说起', '02-类型擦除', '03-通配符与PECS', '04-泛型数组与桥方法'] },
			{ dir: '02-反射', planned: ['01-反射入门', '02-Class对象详解', '03-反射与泛型'] },
			{ dir: '03-注解', planned: ['01-注解基础与自定义注解'] },
			{ dir: '04-异常体系', planned: ['01-异常体系全貌', '02-finally与try-with-resources'] },
			{ dir: '05-String家族', planned: ['01-不可变与字符串常量池'] },
			{ dir: '06-equals与hashCode', planned: ['01-契约与实现'] },
			{ dir: '07-Lambda与Stream', planned: ['01-函数式接口与Lambda', '02-Stream常用操作'] },
			{ dir: '08-JDK8到17', planned: ['01-版本特性速览'] },
			{ dir: '09-OOP', planned: ['01-重载与重写', '02-抽象类与接口', '03-动态绑定与构造器顺序'] },
		],
	},
	{
		dir: '02-设计模式',
		day: 'D1',
		stage: 'P0',
		goal: '面试只考 7 个高频模式：能写代码、能说清解决什么问题、能指出 JDK / Spring 里的现成例子。',
		groups: [
			{
				dir: '',
				planned: [
					'01-单例模式',
					'02-工厂模式',
					'03-策略模式',
					'04-模板方法',
					'05-代理模式',
					'06-观察者模式',
					'07-建造者模式',
				],
			},
		],
	},
	{
		dir: '03-集合框架',
		day: 'D2',
		stage: 'P0',
		goal: '集合是初中级岗位第一道筛子：HashMap 扩容与树化、ConcurrentHashMap 线程安全、迭代器 fail-fast 必须能白板画出来。',
		groups: [
			{ dir: '01-List', planned: ['01-ArrayList扩容', '02-LinkedList与ArrayList取舍'] },
			{ dir: '02-Map', planned: ['01-HashMap原理与扩容', '02-HashMap源码细节', '03-LinkedHashMap与LRU', '04-TreeMap'] },
			{ dir: '03-并发容器', planned: ['01-ConcurrentHashMap', '02-CopyOnWriteArrayList'] },
			{ dir: '04-迭代器', planned: ['01-fail-fast与fail-safe'] },
		],
	},
	{
		dir: '04-并发编程',
		day: 'D3-D4',
		stage: 'P0',
		goal: 'JMM 与锁 → 线程池 → 工具类 → 死锁排查。线程池参数与 ThreadLocal 泄漏是最常被追问的两处。',
		groups: [
			{ dir: '01-内存模型', planned: ['01-JMM与happens-before', '02-volatile'] },
			{ dir: '02-锁', planned: ['01-synchronized与锁升级', '02-CAS与ABA', '03-AQS与ReentrantLock'] },
			{ dir: '03-线程池', planned: ['01-线程池七大参数', '02-容量估算与拒绝策略'] },
			{ dir: '04-工具类', planned: ['01-ThreadLocal', '02-并发工具类', '03-CompletableFuture'] },
			{ dir: '05-问题排查', planned: ['01-死锁定位与预防'] },
		],
	},
	{
		dir: '05-Spring',
		day: 'D5-D6',
		stage: 'P0',
		goal: '8 家里 7 家要 SpringCloud。Bean 生命周期、循环依赖三级缓存、事务失效场景、自动配置原理是必答项。',
		groups: [
			{ dir: '01-Spring核心', planned: ['01-Bean生命周期', '02-循环依赖与三级缓存', '03-AOP原理', '04-事务传播行为', '05-事务失效场景'] },
			{ dir: '02-SpringBoot', planned: ['01-自动配置原理', '02-自定义starter'] },
			{
				dir: '03-SpringCloud',
				planned: ['01-Nacos注册与配置', '02-OpenFeign与负载均衡', '03-Gateway', '04-Sentinel限流熔断', '05-Seata分布式事务'],
			},
		],
	},
	{
		dir: '06-MySQL',
		day: 'D7-D8',
		stage: 'P0',
		goal: '6 家要 MySQL，3 家明写 SQL 优化。索引与 EXPLAIN 是硬门槛，必须手上有真实优化案例和数据。',
		groups: [
			{ dir: '01-索引', planned: ['01-B+树与索引结构', '02-EXPLAIN详解', '03-索引失效场景', '04-回表与覆盖索引'] },
			{ dir: '02-事务与锁', planned: ['01-隔离级别', '02-MVCC', '03-锁与间隙锁'] },
			{ dir: '03-优化', planned: ['01-慢查询与SQL优化实战', '02-深分页优化', '03-分库分表'] },
			{ dir: '04-高可用', planned: ['01-主从复制与读写分离'] },
		],
	},
	{
		dir: '07-Redis',
		day: 'D9',
		stage: 'P0',
		goal: '5 家要 Redis。缓存穿透/击穿/雪崩与分布式锁是必背，双写一致性要能说清取舍。',
		groups: [
			{
				dir: '',
				planned: [
					'01-数据类型与应用场景',
					'02-持久化RDB与AOF',
					'03-过期删除与淘汰策略',
					'04-缓存穿透击穿雪崩',
					'05-双写一致性',
					'06-分布式锁',
					'07-Cluster与哨兵',
					'08-大key与热key',
				],
			},
		],
	},
	{
		dir: '08-Kafka与Linux',
		day: 'D10',
		stage: 'P0',
		goal: '5 家要 MQ、4 家要 Linux。Kafka 讲可靠性、顺序性与积压处置；Linux 会直接考线上排障命令。',
		groups: [
			{ dir: '01-Kafka', planned: ['01-架构与核心概念', '02-为什么快', '03-acks与ISR', '04-重复消费与顺序性', '05-消息积压处置'] },
			{ dir: '02-Linux', planned: ['01-常用命令速查', '02-CPU飙高排查', '03-OOM与内存排查'] },
		],
	},
	{
		dir: '09-MyBatis与分布式事务',
		day: 'D11',
		stage: 'P1',
		goal: '4 家要 MyBatis；中电金信明写分布式事务与幂等，金融岗（4 家）几乎必问。',
		groups: [
			{ dir: '01-MyBatis', planned: ['01-执行流程', '02-占位符与SQL注入', '03-一二级缓存', '04-插件原理'] },
			{ dir: '02-分布式事务', planned: ['01-方案对比', '02-Seata-AT', '03-幂等设计'] },
		],
	},
	{
		dir: '10-JVM',
		day: 'D12',
		stage: 'P1',
		goal: 'TEKsystems 明确要 JVM 基础。重点不是背书，而是能独立走完一次「Full GC 频繁」的排查。',
		groups: [
			{
				dir: '',
				planned: [
					'01-内存结构',
					'02-对象创建与内存布局',
					'03-GC算法与分代',
					'04-CMS与G1',
					'05-GC日志与参数',
					'06-OOM与内存泄漏定位',
				],
			},
		],
	},
	{
		dir: '11-Docker与K8s',
		day: 'D13',
		stage: 'P1',
		goal: '软通动力（外包汇丰）要 K8s/Docker，TEKsystems 列为优先。会写 Dockerfile、会看 Pod 日志即可。',
		groups: [
			{
				dir: '',
				planned: ['01-Docker基础与镜像分层', '02-Dockerfile最佳实践', '03-K8s核心对象', '04-滚动更新与排障'],
			},
		],
	},
	{
		dir: '12-Git与Maven',
		day: 'D14',
		stage: 'P1',
		goal: '德科、TEKsystems、京北方都明写 Git/Maven。撤销与恢复、依赖调解是高频考点。',
		groups: [
			{ dir: '', planned: ['01-Git撤销与恢复', '02-merge与rebase', '03-Maven依赖调解'] },
		],
	},
];
