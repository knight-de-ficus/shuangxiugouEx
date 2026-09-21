import React, { useCallback, useEffect, useState } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  Send,
  PlusCircle
} from 'lucide-react';
import type { CommunityPost, PostCategory } from '../types';
import {
  createCommunityPost,
  createCommunityReply,
  listCommunityPosts,
  voteForCommunityPost,
} from '../api/client';

export const CommunityLounge: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | PostCategory>('all');
  const [upvotedPostIds, setUpvotedPostIds] = useState<Record<string, boolean>>({});

  // 展开回复的帖子
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // 发帖 Modal
  const [showPostModal, setShowPostModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newCategory, setNewCategory] = useState<PostCategory>('avoid_trap');
  const [newRole, setNewRole] = useState('在职打工人');
  const [newContent, setNewContent] = useState('');
  const [newBadge, setNewBadge] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reloadPosts = useCallback(async () => {
    const result = await listCommunityPosts();
    setPosts(result.posts);
  }, []);

  useEffect(() => {
    void reloadPosts()
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : '讨论区加载失败。'))
      .finally(() => setLoading(false));
  }, [reloadPosts]);

  const handleUpvote = async (postId: string) => {
    if (upvotedPostIds[postId]) return;
    setError('');
    try {
      await voteForCommunityPost(postId);
      setUpvotedPostIds((prev) => ({ ...prev, [postId]: true }));
      setError('点赞已提交审核，通过后才会公开计数。');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '点赞保存失败。');
    }
  };

  const handleAddReply = async (postId: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await createCommunityReply(postId, replyText.trim());
      setReplyText('');
      setError('回复已提交审核，通过后才会公开。');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '回复保存失败。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await createCommunityPost({
        authorRole: newRole,
        targetCompany: newTarget,
        category: newCategory,
        title: newTitle,
        content: newContent,
        evidenceBadge: newBadge,
      });
      setShowPostModal(false);
      setNewTitle('');
      setNewTarget('');
      setNewContent('');
      setNewBadge('');
      setError('帖子已提交审核，通过后才会公开。');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '帖子保存失败。');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (activeTab === 'all') return true;
    return p.category === activeTab;
  });

  return (
    <div className="space-y-8">
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">{error}</div>}

      {/* 头部社区横幅 */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-bold border border-red-400/30">
            <MessageSquare className="w-3.5 h-3.5 text-red-400" />
            打工人茶水间 · 真实互助讨论广场
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            这里没有公关控评：
            <span className="bg-gradient-to-r from-red-400 to-rose-300 bg-clip-text text-transparent">
              员工敢讲真工时，买家抱团选平替
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            社区内容由用户匿名提交并保存到 D1，不代表平台已经核验。
            欢迎提供公开来源、客观描述岗位差异，并避免发布个人敏感信息。
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {[
              { id: 'all', label: '全部交流' },
              { id: 'avoid_trap', label: '避雷曝光墙', icon: ShieldAlert },
              { id: 'recommend_wlb', label: '良心种草区', icon: ShieldCheck },
              { id: 'ask_intel', label: '求扒悬赏区', icon: HelpCircle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-red-500 text-slate-950 shadow-md shadow-red-500/20'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowPostModal(true)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-red-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>匿名发帖交流</span>
          </button>
        </div>
      </div>

      {/* 帖子瀑布流 */}
      <div className="space-y-4">
        {loading && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">正在加载讨论…</div>}
        {!loading && filteredPosts.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">这里还没有帖子，欢迎发起第一条理性讨论。</div>}
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition space-y-4"
          >
            {/* 头部作者信息 */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                  {post.authorAlias.slice(-2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{post.authorAlias}</span>
                    {post.authorRole && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium border border-slate-200">
                        {post.authorRole}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{post.createdAt}</div>
                </div>
              </div>

              {/* 标签 */}
              <div className="flex items-center gap-1.5">
                {post.evidenceBadge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300 font-medium">
                    ★ {post.evidenceBadge}
                  </span>
                )}
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    post.category === 'avoid_trap'
                      ? 'bg-rose-100 text-rose-800'
                      : post.category === 'recommend_wlb'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {post.category === 'avoid_trap'
                    ? '避雷曝光'
                    : post.category === 'recommend_wlb'
                    ? '良心平替'
                    : '企业求扒'}
                </span>
              </div>
            </div>

            {/* 帖子正文 */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-bold font-mono">
                  @{post.targetBrandName}
                </span>
                <h3 className="font-black text-slate-900 text-sm sm:text-base leading-snug">
                  {post.title}
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">{post.content}</p>
            </div>

            {/* 互动动作区 */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => void handleUpvote(post.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
                    upvotedPostIds[post.id]
                      ? 'bg-red-50 border-red-300 text-red-700 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{post.upvotes} 认同</span>
                </button>

                <button
                  onClick={() =>
                    setExpandedPostId(expandedPostId === post.id ? null : post.id)
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{post.repliesCount} 条交流</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400">匿名展示 · 内容待社区核验</div>
            </div>

            {/* 回复折叠楼层 */}
            {expandedPostId === post.id && (
              <div className="pt-3 mt-3 border-t border-slate-100 space-y-3 bg-slate-50/60 p-4 rounded-2xl">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>精选讨论交流 ({post.replies?.length || 0})</span>
                  <span className="text-[10px] text-slate-400 font-normal">全网共 {post.repliesCount} 位打工人参与互动</span>
                </div>

                <div className="space-y-2">
                  {post.replies?.map((rep) => (
                    <div
                      key={rep.id}
                      className="bg-white p-3 rounded-xl border border-slate-200/80 text-xs space-y-1"
                    >
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="font-bold text-slate-700">{rep.author}</span>
                        <span className="font-mono">{rep.createdAt}</span>
                      </div>
                      <p className="text-slate-700 leading-normal">{rep.content}</p>
                    </div>
                  ))}
                  {(!post.replies || post.replies.length === 0) && (
                    <div className="text-[11px] text-slate-400 py-2">暂无展开的精选回复，快来抢首评！</div>
                  )}
                </div>

                {/* 快速回复框 */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="匿名理性留言交流，共同打破信息差..."
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                    onKeyDown={(e) => e.key === 'Enter' && void handleAddReply(post.id)}
                  />
                  <button
                    onClick={() => void handleAddReply(post.id)}
                    disabled={submitting}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                  >
                    <Send className="w-3 h-3" />
                    <span>发言</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 发帖弹窗 Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto text-slate-900">
            <div className="bg-slate-900 text-white p-6 relative">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-red-400" />
                    发起匿名讨论 / 爆料 / 种草
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    不要求登录或真实姓名；内容将公开展示，请勿提交个人敏感信息。
                  </p>
                </div>
                <button
                  onClick={() => setShowPostModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">讨论主题类型:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'avoid_trap', label: '避雷单休曝光' },
                    { id: 'recommend_wlb', label: '良心双休平替' },
                    { id: 'ask_intel', label: '求扒企业工时' }
                  ].map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setNewCategory(t.id as any)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition ${
                        newCategory === t.id
                          ? 'border-red-600 bg-red-50 text-red-900 ring-2 ring-red-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">针对品牌/企业:</label>
                  <input
                    type="text"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    placeholder="如：某汽车厂 / 某咖啡连锁"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">你的身份标签:</label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="如：在职技术 / 离职员工 / 消费者"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">帖子标题:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="简洁有力的标题，吸引更多打工人关注..."
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">客观陈述内容:</label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="客观写明部门、作息、下班时间、加班费是否发放，或为什么推荐/避雷该品牌..."
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  佐证凭据标签 (可选):
                </label>
                <input
                  type="text"
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                  placeholder="如：劳动裁判文书网案号 / 工牌脱敏 / 官方通报链接"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md shadow-slate-900/20"
                >
                  {submitting ? '保存中…' : '发布交流'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
