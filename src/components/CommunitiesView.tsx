import React, { useState, useEffect } from "react";
import { Users, Plus, Shield, Search, ArrowLeft, Globe, MessageSquare, Check, Sparkles } from "lucide-react";
import { Community, Post } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { PostCard } from "./PostCard";
import { CreatePostBox } from "./CreatePostBox";

interface CommunitiesViewProps {
  onShowToast: (message: string, type?: "success" | "error" | "info") => void;
  onShowImageModal: (url: string, allImages?: string[], initialIndex?: number) => void;
  onOpenAuthModal: () => void;
}

export const CommunitiesView: React.FC<CommunitiesViewProps> = ({
  onShowToast,
  onShowImageModal,
  onOpenAuthModal,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New community form state
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [newBanner, setNewBanner] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const data = await api.getCommunities();
      setCommunities(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải danh sách cộng đồng";
      onShowToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunityPosts = async (commId: string) => {
    try {
      setLoadingPosts(true);
      // Fetch all posts and filter by communityId or specific API
      const res = await api.getPosts();
      const filtered = res.filter((p) => p.communityId === commId);
      setCommunityPosts(filtered);
    } catch {
      onShowToast("Không thể tải bài viết của cộng đồng", "error");
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleSelectCommunity = (comm: Community) => {
    setSelectedCommunity(comm);
    fetchCommunityPosts(comm.id);
  };

  const handleToggleJoin = async (commId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAuthenticated) {
      onOpenAuthModal();
      return;
    }
    try {
      const res = await api.joinCommunity(commId);
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === commId
            ? { ...c, isMember: res.isMember, membersCount: res.membersCount }
            : c
        )
      );
      if (selectedCommunity && selectedCommunity.id === commId) {
        setSelectedCommunity((prev) =>
          prev ? { ...prev, isMember: res.isMember, membersCount: res.membersCount } : null
        );
      }
      onShowToast(res.isMember ? "Đã tham gia cộng đồng thành công!" : "Đã rời khỏi cộng đồng.", "success");
    } catch {
      onShowToast("Thực hiện thao tác thất bại", "error");
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onOpenAuthModal();
      return;
    }
    if (!newName.trim()) {
      onShowToast("Vui lòng nhập tên cộng đồng", "error");
      return;
    }

    try {
      setIsCreating(true);
      const created = await api.createCommunity({
        name: newName,
        description: newDesc,
        avatar: newAvatar || undefined,
        banner: newBanner || undefined,
      });
      onShowToast("Tạo cộng đồng mới thành công!", "success");
      setShowCreateModal(false);
      setNewName("");
      setNewDesc("");
      setNewAvatar("");
      setNewBanner("");
      fetchCommunities();
      handleSelectCommunity(created);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tạo cộng đồng thất bại";
      onShowToast(msg, "error");
    } finally {
      setIsCreating(false);
    }
  };

  const filteredCommunities = communities.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If a community is selected, render community detail view
  if (selectedCommunity) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {/* Back Button & Header Bar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedCommunity(null)}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách cộng đồng</span>
          </button>
        </div>

        {/* Community Banner & Profile Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="h-48 md:h-64 relative bg-slate-900 overflow-hidden">
            <img
              src={selectedCommunity.banner || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80"}
              alt={selectedCommunity.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => handleToggleJoin(selectedCommunity.id, e)}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                  selectedCommunity.isMember
                    ? "bg-slate-800/90 hover:bg-rose-600/90 text-white border border-slate-700"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30"
                }`}
              >
                {selectedCommunity.isMember ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Đã tham gia</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Tham gia cộng đồng</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="px-6 pb-6 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-14 mb-4">
              <img
                src={selectedCommunity.avatar}
                alt={selectedCommunity.name}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white dark:border-slate-800 shadow-lg bg-white"
              />
              <div className="flex-1 pt-2 sm:pt-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                    {selectedCommunity.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    <Shield className="w-3 h-3" />
                    Cộng đồng chính thức
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  @{selectedCommunity.slug} • Được tạo bởi {selectedCommunity.creator?.name || "Admin"}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed mb-4">
              {selectedCommunity.description}
            </p>

            <div className="flex items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-500" />
                <span className="font-bold text-slate-900 dark:text-white">{selectedCommunity.membersCount || 1}</span> thành viên
              </div>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-slate-900 dark:text-white">{communityPosts.length}</span> bài viết
              </div>
            </div>
          </div>
        </div>

        {/* Create Post in Community */}
        {selectedCommunity.isMember && (
          <CreatePostBox
            onPostCreated={(newPost) => {
              setCommunityPosts((prev) => [newPost, ...prev]);
            }}
            onShowToast={onShowToast}
            onOpenAuthModal={onOpenAuthModal}
            defaultCommunityId={selectedCommunity.id}
          />
        )}

        {/* Community Posts Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Bài viết trong cộng đồng</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
                {communityPosts.length}
              </span>
            </h3>
          </div>

          {loadingPosts ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 bg-white dark:bg-slate-800 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-700" />
              ))}
            </div>
          ) : communityPosts.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">Chưa có bài viết nào</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                Hãy là thành viên đầu tiên chia sẻ góc nhìn hoặc đặt câu hỏi trong cộng đồng {selectedCommunity.name}!
              </p>
              {!selectedCommunity.isMember && (
                <button
                  type="button"
                  onClick={(e) => handleToggleJoin(selectedCommunity.id, e)}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition-colors"
                >
                  Tham gia để đăng bài
                </button>
              )}
            </div>
          ) : (
            communityPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostUpdated={(updated) => {
                  setCommunityPosts((prev) => prev.map((p) => p.id === updated.id ? updated : p));
                }}
                onPostDeleted={(postId) => {
                  setCommunityPosts((prev) => prev.filter((p) => p.id !== postId));
                }}
                onShowToast={onShowToast}
                onShowImageModal={onShowImageModal}
                onOpenAuthModal={onOpenAuthModal}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  // Main Communities List View
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-indigo-300 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-bold mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Cộng đồng chuyên đề StageBiz</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">
            Khám phá & Tham gia Cộng đồng Sở thích
          </h1>
          <p className="text-xs md:text-sm text-indigo-200 leading-relaxed mb-6">
            Kết nối với những người có cùng đam mê công nghệ, thiết kế, khởi nghiệp và chia sẻ kiến thức chất lượng cao trong không gian văn minh.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  onOpenAuthModal();
                  return;
                }
                setShowCreateModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Tạo cộng đồng mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm cộng đồng..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
        </div>
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 w-full sm:w-auto text-right">
          Hiển thị {filteredCommunities.length} cộng đồng
        </div>
      </div>

      {/* Communities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-white dark:bg-slate-800 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-700" />
          ))}
        </div>
      ) : filteredCommunities.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
            <Globe className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Không tìm thấy cộng đồng</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Không có cộng đồng nào khớp với từ khóa "{searchQuery}". Hãy thử tìm kiếm với từ khóa khác hoặc tạo cộng đồng mới.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((comm) => (
            <div
              key={comm.id}
              onClick={() => handleSelectCommunity(comm)}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col"
            >
              <div className="h-32 bg-slate-900 relative overflow-hidden">
                <img
                  src={comm.banner || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80"}
                  alt={comm.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs ${
                    comm.isMember
                      ? "bg-emerald-500/90 text-white"
                      : "bg-black/60 text-indigo-200 border border-white/20"
                  }`}>
                    {comm.isMember ? "Đã tham gia" : "Công khai"}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col relative pt-0">
                <div className="-mt-10 mb-3 flex items-end justify-between">
                  <img
                    src={comm.avatar}
                    alt={comm.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover border-4 border-white dark:border-slate-800 shadow-md bg-white"
                  />
                </div>

                <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1">
                  {comm.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4 flex-1">
                  {comm.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/60 mt-auto">
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <strong className="text-slate-900 dark:text-white">{comm.membersCount || 1}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      <strong className="text-slate-900 dark:text-white">{comm.postsCount || 0}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleToggleJoin(comm.id, e)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      comm.isMember
                        ? "bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 hover:text-rose-600 text-slate-700 dark:text-slate-200"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                    }`}
                  >
                    {comm.isMember ? "Rời nhóm" : "Tham gia"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <span>Tạo cộng đồng mới</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCommunity} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên cộng đồng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ví dụ: Lập trình Python & AI"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả cộng đồng
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Mô tả mục đích, quy tắc và đối tượng tham gia..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ảnh đại diện (Avatar URL)
                </label>
                <input
                  type="url"
                  value={newAvatar}
                  onChange={(e) => setNewAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ảnh bìa (Banner URL)
                </label>
                <input
                  type="url"
                  value={newBanner}
                  onChange={(e) => setNewBanner(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isCreating ? "Đang tạo..." : "Tạo cộng đồng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
