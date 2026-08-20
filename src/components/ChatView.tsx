import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { 
  MessageSquare, 
  Plus, 
  KeyRound, 
  Copy, 
  Check, 
  Users, 
  Crown, 
  UserCheck, 
  UserX, 
  Send, 
  Image as ImageIcon, 
  Trash2, 
  LogOut, 
  Clock, 
  AlertCircle, 
  X,
  Search,
  Sparkles,
  Info,
  ShieldCheck,
  RefreshCw,
  Smile
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { ChatRoom, ChatMessage, ReactionType } from "../types";
import { VerifiedBadge } from "./VerifiedBadge";
import { ReactionPicker } from "./Reactions";

interface ChatViewProps {
  onSelectUser: (userId: string) => void;
  onShowImageModal: (url: string) => void;
  onShowToast: (text: string, type?: "success" | "error" | "info") => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  onSelectUser,
  onShowImageModal,
  onShowToast,
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();

  // Rooms & Selected Room
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomFilter, setRoomFilter] = useState<string>("");
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  // Active Room Messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Modals & Panels
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);
  const [showPendingApprovalPanel, setShowPendingApprovalPanel] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Create Room Form State
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomCode, setNewRoomCode] = useState("");
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [newRoomRequireApproval, setNewRoomRequireApproval] = useState(true);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // Join Room Form State
  const [joinCode, setJoinCode] = useState("");
  const [joinMessage, setJoinMessage] = useState("");
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  // Active Reaction Picker on Message
  const [activeMessageReactionPickerId, setActiveMessageReactionPickerId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || null;

  // 1. Fetch Rooms List
  const fetchRooms = useCallback(async (keepSelected = true) => {
    try {
      const data = await api.getChatRooms();
      setRooms(data);
      if (data.length > 0) {
        if (!keepSelected || !selectedRoomId) {
          setSelectedRoomId(data[0].id);
        }
      }
    } catch {
      // ignore silent fetch error
    } finally {
      setIsLoadingRooms(false);
    }
  }, [selectedRoomId]);

  useEffect(() => {
    fetchRooms(false);
  }, []);

  // 2. Fetch Messages for Selected Room
  const fetchMessages = useCallback(async (roomId: string) => {
    if (!roomId) return;
    try {
      const data = await api.getChatMessages(roomId);
      setMessages(data);
    } catch {
      // user might not be approved yet
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (selectedRoomId) {
      const room = rooms.find((r) => r.id === selectedRoomId);
      if (room && (room.isMember || room.isOwner)) {
        setIsLoadingMessages(true);
        fetchMessages(selectedRoomId).finally(() => setIsLoadingMessages(false));
      } else {
        setMessages([]);
      }
    }
  }, [selectedRoomId, rooms, fetchMessages]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Auto-polling for real-time chat & approval updates (every 3.5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedRoomId) {
        const room = rooms.find((r) => r.id === selectedRoomId);
        if (room && (room.isMember || room.isOwner)) {
          fetchMessages(selectedRoomId);
        }
      }
      fetchRooms(true);
    }, 3500);

    return () => clearInterval(interval);
  }, [selectedRoomId, rooms, fetchMessages, fetchRooms]);

  // Copy room code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    onShowToast(`Đã sao chép mã phòng: ${code}`, "success");
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Create Room Handler
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    if (!newRoomName.trim()) {
      onShowToast("Vui lòng nhập tên box chat", "error");
      return;
    }

    setIsCreatingRoom(true);
    try {
      const res = await api.createChatRoom({
        name: newRoomName.trim(),
        roomCode: newRoomCode.trim() || undefined,
        description: newRoomDesc.trim() || undefined,
        isRequireApproval: newRoomRequireApproval,
      });

      onShowToast(res.message, "success");
      setNewRoomName("");
      setNewRoomCode("");
      setNewRoomDesc("");
      setShowCreateModal(false);
      await fetchRooms(true);
      setSelectedRoomId(res.data.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi tạo phòng chat";
      onShowToast(msg, "error");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // Join Room with Code Handler
  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    if (!joinCode.trim()) {
      onShowToast("Vui lòng nhập mã tham gia phòng", "error");
      return;
    }

    setIsJoiningRoom(true);
    try {
      const res = await api.joinRoomByCode(joinCode.trim(), joinMessage.trim() || undefined);
      onShowToast(res.message, "success");
      setJoinCode("");
      setJoinMessage("");
      setShowJoinModal(false);
      await fetchRooms(true);
      setSelectedRoomId(res.data.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tham gia phòng";
      onShowToast(msg, "error");
    } finally {
      setIsJoiningRoom(false);
    }
  };

  // Send Message Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    if (!selectedRoomId) return;
    if (!messageInput.trim() && !imageUrlInput.trim()) return;

    const content = messageInput.trim();
    const image = imageUrlInput.trim() || undefined;

    setMessageInput("");
    setImageUrlInput("");
    setShowImageInput(false);
    setIsSending(true);

    try {
      const newMsg = await api.sendChatMessage(selectedRoomId, content, image);
      setMessages((prev) => [...prev, newMsg]);
      // refresh room last message
      fetchRooms(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể gửi tin nhắn";
      onShowToast(msg, "error");
    } finally {
      setIsSending(false);
    }
  };

  // Approve Pending Request Handler (Trưởng phòng only)
  const handleApproveRequest = async (roomId: string, targetUserId: string) => {
    try {
      const res = await api.approveJoinRequest(roomId, targetUserId);
      onShowToast(res.message, "success");
      await fetchRooms(true);
      await fetchMessages(roomId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi phê duyệt";
      onShowToast(msg, "error");
    }
  };

  // Reject Pending Request Handler (Trưởng phòng only)
  const handleRejectRequest = async (roomId: string, targetUserId: string) => {
    try {
      const res = await api.rejectJoinRequest(roomId, targetUserId);
      onShowToast(res.message, "info");
      await fetchRooms(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi từ chối";
      onShowToast(msg, "error");
    }
  };

  // Remove Member or Leave Room
  const handleRemoveOrLeaveMember = async (roomId: string, targetUserId: string) => {
    const isSelf = user?.id === targetUserId;
    const confirmMsg = isSelf
      ? "Bạn có chắc chắn muốn rời khỏi phòng chat này không?"
      : "Bạn có chắc chắn muốn xóa thành viên này khỏi phòng chat?";
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.removeRoomMember(roomId, targetUserId);
      onShowToast(res.message, "success");
      await fetchRooms(true);
      if (isSelf) {
        setShowMembersDrawer(false);
      } else {
        await fetchMessages(roomId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi thao tác";
      onShowToast(msg, "error");
    }
  };

  // Delete Room (Trưởng phòng only)
  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn giải tán và xóa vĩnh viễn box chat này không? Tất cả tin nhắn sẽ bị xóa.")) {
      return;
    }

    try {
      const res = await api.deleteChatRoom(roomId);
      onShowToast(res.message, "success");
      setSelectedRoomId(null);
      await fetchRooms(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi xóa phòng chat";
      onShowToast(msg, "error");
    }
  };

  // React to Message
  const handleReactToMessage = async (messageId: string, type: ReactionType) => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    if (!selectedRoomId) return;

    setActiveMessageReactionPickerId(null);
    try {
      const res = await api.reactToChatMessage(selectedRoomId, messageId, type);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                userReaction: res.userReaction,
                reactionsSummary: res.reactionsSummary,
                reactions: res.reactions,
              }
            : msg
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi bày tỏ cảm xúc";
      onShowToast(msg, "error");
    }
  };

  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(roomFilter.toLowerCase()) ||
    r.roomCode.toLowerCase().includes(roomFilter.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col md:flex-row h-[780px]">
      
      {/* ========================================================= */}
      {/* LEFT COLUMN: ROOMS LIST & ACTIONS (340px)                */}
      {/* ========================================================= */}
      <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
        
        {/* Header with Title & Action Buttons */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Box Chat & Nhóm
              </h2>
            </div>

            <button
              onClick={() => fetchRooms(true)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
              title="Làm mới danh sách"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons: Tạo phòng & Nhập mã */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-open-create-room"
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal("login");
                  return;
                }
                setShowCreateModal(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Box Chat</span>
            </button>

            <button
              id="btn-open-join-room"
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal("login");
                  return;
                }
                setShowJoinModal(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-xs transition-all"
            >
              <KeyRound className="w-4 h-4" />
              <span>Nhập mã Code</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              placeholder="Tìm box chat theo tên hoặc mã code..."
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Rooms List Scrollable */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
          {isLoadingRooms ? (
            <div className="p-8 text-center flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400">Đang tải danh sách phòng...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-6 text-center text-slate-400 flex flex-col items-center gap-2">
              <Info className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              <p className="text-xs">Không tìm thấy phòng chat nào.</p>
              <p className="text-[11px] text-slate-400">Hãy bấm <strong>"Tạo Box Chat"</strong> hoặc <strong>"Nhập mã Code"</strong> để tham gia!</p>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const isSelected = room.id === selectedRoomId;
              const hasPending = room.isOwner && (room.pendingCount || 0) > 0;

              return (
                <button
                  key={room.id}
                  id={`room-item-${room.id}`}
                  onClick={() => {
                    setSelectedRoomId(room.id);
                    setShowPendingApprovalPanel(false);
                    setShowMembersDrawer(false);
                  }}
                  className={`w-full p-3 rounded-2xl flex items-start gap-3 text-left transition-all relative ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs"
                      : "hover:bg-white dark:hover:bg-slate-800/70 border border-transparent"
                  }`}
                >
                  {/* Room Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={room.avatar || room.owner?.avatar || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&auto=format&fit=crop&q=80"}
                      alt={room.name}
                      className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                    />
                    {room.isOwner && (
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full shadow-xs" title="Bạn là Trưởng phòng">
                        <Crown className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Room Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {room.name}
                      </h3>
                      <span className="text-[10px] font-mono font-bold bg-slate-200/80 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded shrink-0">
                        {room.roomCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
                      <Users className="w-3 h-3" />
                      <span>{room.membersCount} thành viên</span>
                      <span>•</span>
                      <span className="truncate">Trưởng phòng: {room.owner?.name}</span>
                    </div>

                    {/* Last Message preview */}
                    {room.lastMessage ? (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        <strong className="text-slate-700 dark:text-slate-300">{room.lastMessage.senderName}: </strong>
                        {room.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">Chưa có tin nhắn nào</p>
                    )}

                    {/* Status Badge */}
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      {room.isOwner && (
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 px-1.5 py-0.2 rounded-md">
                          👑 Trưởng phòng
                        </span>
                      )}
                      {room.isMember && !room.isOwner && (
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 px-1.5 py-0.2 rounded-md">
                          ✓ Đã tham gia
                        </span>
                      )}
                      {room.isPending && (
                        <span className="text-[10px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 px-1.5 py-0.2 rounded-md flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          Chờ duyệt
                        </span>
                      )}
                      {hasPending && (
                        <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.2 rounded-full animate-pulse">
                          {room.pendingCount} yêu cầu xin vào
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT COLUMN: ACTIVE CHAT ROOM CONVERSATION               */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 min-w-0 relative">
        
        {selectedRoom ? (
          <>
            {/* Top Room Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10">
              
              {/* Room Title & Code */}
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={selectedRoom.avatar || selectedRoom.owner?.avatar || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&auto=format&fit=crop&q=80"}
                  alt={selectedRoom.name}
                  className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {selectedRoom.name}
                    </h3>
                    {selectedRoom.isRequireApproval && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 px-1.5 py-0.5 rounded" title="Yêu cầu Trưởng phòng duyệt khi nhập mã">
                        <ShieldCheck className="w-3 h-3" />
                        Có duyệt
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    {/* Room Code Badge with Copy */}
                    <button
                      onClick={() => handleCopyCode(selectedRoom.roomCode)}
                      className="inline-flex items-center gap-1 font-mono font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded transition-colors text-[11px]"
                      title="Bấm để sao chép mã phòng"
                    >
                      <span>Mã: {selectedRoom.roomCode}</span>
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>

                    <span>•</span>
                    <span className="truncate">
                      Trưởng phòng: <strong>{selectedRoom.owner?.name}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Room Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                
                {/* If Owner: Button to view Pending Requests */}
                {selectedRoom.isOwner && (
                  <button
                    id="btn-toggle-pending-requests"
                    onClick={() => {
                      setShowPendingApprovalPanel(!showPendingApprovalPanel);
                      setShowMembersDrawer(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                      (selectedRoom.pendingCount || 0) > 0
                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs animate-bounce"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                    }`}
                    title="Quản lý yêu cầu duyệt vào phòng"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Duyệt ({selectedRoom.pendingCount || 0})</span>
                  </button>
                )}

                {/* View Members List Button */}
                <button
                  id="btn-toggle-members-drawer"
                  onClick={() => {
                    setShowMembersDrawer(!showMembersDrawer);
                    setShowPendingApprovalPanel(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  title="Danh sách thành viên"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Thành viên ({selectedRoom.membersCount})</span>
                </button>

                {/* Delete / Dissolve Room button for Owner */}
                {selectedRoom.isOwner && (
                  <button
                    onClick={() => handleDeleteRoom(selectedRoom.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                    title="Giải tán phòng chat này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* ========================================================= */}
            {/* TRƯỞNG PHÒNG APPROVAL PANEL (When Toggled)                 */}
            {/* ========================================================= */}
            {showPendingApprovalPanel && selectedRoom.isOwner && (
              <div className="bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 p-4 animate-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                      Phê duyệt thành viên xin vào phòng (Dành riêng cho Trưởng phòng)
                    </h4>
                  </div>
                  <button
                    onClick={() => setShowPendingApprovalPanel(false)}
                    className="p-1 text-amber-700 hover:text-amber-900 dark:text-amber-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {(!selectedRoom.pendingRequests || selectedRoom.pendingRequests.length === 0) ? (
                  <div className="text-center py-4 text-xs text-amber-800 dark:text-amber-300">
                    Hiện tại không có yêu cầu nào đang chờ duyệt. 🎉
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                    {selectedRoom.pendingRequests.map((req) => (
                      <div
                        key={req.userId}
                        className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-amber-200 dark:border-amber-800/60 shadow-xs flex flex-col gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={req.user.avatar}
                            alt={req.user.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {req.user.name}
                              </span>
                              {req.user.isVerified && <VerifiedBadge size="xs" />}
                            </div>
                            <span className="text-[11px] text-slate-400 truncate">@{req.user.username}</span>
                          </div>
                        </div>

                        {req.message && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl italic">
                            "{req.message}"
                          </p>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/50">
                          <button
                            onClick={() => handleRejectRequest(selectedRoom.id, req.userId)}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Từ chối</span>
                          </button>
                          <button
                            onClick={() => handleApproveRequest(selectedRoom.id, req.userId)}
                            className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Duyệt vào</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* MEMBERS DRAWER / POPUP (When Toggled)                     */}
            {/* ========================================================= */}
            {showMembersDrawer && (
              <div className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 p-4 animate-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                      Danh sách thành viên ({selectedRoom.membersCount})
                    </h4>
                  </div>
                  <button
                    onClick={() => setShowMembersDrawer(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto">
                  {selectedRoom.membersList?.map((member) => {
                    const isMemberOwner = member.id === selectedRoom.ownerId;
                    const isCurrentUser = member.id === user?.id;

                    return (
                      <div
                        key={member.id}
                        className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                      >
                        <div
                          className="flex items-center gap-2 min-w-0 cursor-pointer"
                          onClick={() => onSelectUser(member.id)}
                        >
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {member.name}
                              </p>
                              {member.isVerified && <VerifiedBadge size="xs" />}
                            </div>
                            <span className="text-[10px] text-slate-400 truncate">@{member.username}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {isMemberOwner ? (
                            <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                              Trưởng phòng 👑
                            </span>
                          ) : (
                            <>
                              {selectedRoom.isOwner && !isCurrentUser && (
                                <button
                                  onClick={() => handleRemoveOrLeaveMember(selectedRoom.id, member.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                  title="Xóa khỏi phòng"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {isCurrentUser && (
                                <button
                                  onClick={() => handleRemoveOrLeaveMember(selectedRoom.id, user.id)}
                                  className="px-2 py-0.5 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded flex items-center gap-1"
                                >
                                  <LogOut className="w-3 h-3" />
                                  Rời phòng
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* MAIN MESSAGES VIEW AREA                                   */}
            {/* ========================================================= */}
            {selectedRoom.isPending ? (
              /* User has submitted code and is awaiting approval */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 shadow-sm">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Yêu cầu đang chờ Trưởng phòng duyệt
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4">
                  Bạn đã gửi mã tham gia phòng <strong>"{selectedRoom.name}"</strong>. Trưởng phòng (<strong>{selectedRoom.owner?.name}</strong>) sẽ xem xét và phê duyệt bạn vào nhóm trong thời gian sớm nhất!
                </p>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 font-medium">
                  💡 Mẹo: Bạn có thể đổi sang tài khoản của Trưởng phòng ở menu góc trên để thử tính năng duyệt ngay lập tức.
                </div>
              </div>
            ) : !selectedRoom.isMember && !selectedRoom.isOwner ? (
              /* User has not joined this room yet */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="w-16 h-16 rounded-3xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-sm">
                  <KeyRound className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Cần mã tham gia và duyệt từ Trưởng phòng
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4">
                  Phòng chat <strong>"{selectedRoom.name}"</strong> được bảo mật bằng mã tham gia. Hãy nhập mã phòng <code>{selectedRoom.roomCode}</code> để xin vào phòng!
                </p>
                <button
                  onClick={() => {
                    setJoinCode(selectedRoom.roomCode);
                    setShowJoinModal(true);
                  }}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-105"
                >
                  Xin tham gia phòng này ngay
                </button>
              </div>
            ) : (
              /* User is an approved Member or Owner -> Show chat feed */
              <div className="flex-1 flex flex-col min-h-0">
                
                {/* Messages Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {isLoadingMessages ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-12">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-xs text-slate-400">Đang tải tin nhắn phòng chat...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                      <Sparkles className="w-8 h-8 text-indigo-400 mb-2" />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Chưa có tin nhắn nào trong phòng này
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Hãy là người đầu tiên gửi tin nhắn chào mừng các thành viên!
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === user?.id;
                      const isMsgOwner = msg.sender?.isOwner;

                      return (
                        <div
                          key={msg.id}
                          id={`chat-msg-${msg.id}`}
                          className={`flex items-start gap-2.5 group relative ${
                            isMe ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          {/* Sender Avatar */}
                          <img
                            src={msg.sender?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                            alt={msg.sender?.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer"
                            onClick={() => onSelectUser(msg.senderId)}
                          />

                          {/* Message Bubble Content */}
                          <div className={`flex flex-col max-w-[78%] ${isMe ? "items-end" : "items-start"}`}>
                            
                            {/* Sender Name & Role Header */}
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span
                                className="text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:underline"
                                onClick={() => onSelectUser(msg.senderId)}
                              >
                                {msg.sender?.name}
                              </span>
                              {msg.sender?.isVerified && <VerifiedBadge size="xs" />}
                              {isMsgOwner && (
                                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1 py-0.2 rounded">
                                  Trưởng phòng 👑
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {/* Bubble */}
                            <div
                              className={`relative p-3 rounded-2xl text-xs transition-shadow shadow-2xs ${
                                isMe
                                  ? "bg-indigo-600 text-white rounded-tr-none"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-slate-700/60"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words leading-relaxed">
                                {msg.content}
                              </p>

                              {/* Attached Image if any */}
                              {msg.image && (
                                <div className="mt-2 rounded-xl overflow-hidden cursor-pointer">
                                  <img
                                    src={msg.image}
                                    alt="Đính kèm"
                                    className="max-h-60 w-auto rounded-xl object-cover hover:scale-102 transition-transform"
                                    onClick={() => onShowImageModal(msg.image!)}
                                  />
                                </div>
                              )}

                              {/* Reaction Badges at bottom right of bubble */}
                              {msg.reactionsSummary && msg.reactionsSummary.total > 0 && (
                                <div
                                  className={`absolute -bottom-2 ${
                                    isMe ? "left-2" : "right-2"
                                  } flex items-center gap-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-full shadow-xs text-[10px]`}
                                >
                                  {msg.reactionsSummary.like > 0 && <span>👍</span>}
                                  {msg.reactionsSummary.love > 0 && <span>❤️</span>}
                                  {msg.reactionsSummary.haha > 0 && <span>😆</span>}
                                  {msg.reactionsSummary.wow > 0 && <span>😮</span>}
                                  {msg.reactionsSummary.sad > 0 && <span>😢</span>}
                                  {msg.reactionsSummary.angry > 0 && <span>😡</span>}
                                  <span className="font-bold text-slate-700 dark:text-slate-200 ml-0.5">
                                    {msg.reactionsSummary.total}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Message Reaction Picker Hover Trigger */}
                            <div className="relative mt-1">
                              <button
                                onClick={() =>
                                  setActiveMessageReactionPickerId(
                                    activeMessageReactionPickerId === msg.id ? null : msg.id
                                  )
                                }
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 text-[11px] flex items-center gap-1 transition-opacity"
                                title="Bày tỏ cảm xúc với tin nhắn"
                              >
                                <Smile className="w-3.5 h-3.5" />
                                <span>Thả cảm xúc</span>
                              </button>

                              {activeMessageReactionPickerId === msg.id && (
                                <div className="absolute z-20 bottom-full mb-1">
                                  <ReactionPicker
                                    onSelectReaction={(type) => handleReactToMessage(msg.id, type)}
                                    onClose={() => setActiveMessageReactionPickerId(null)}
                                  />
                                </div>
                              )}
                            </div>

                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Image URL preview / input */}
                {showImageInput && (
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                    <input
                      type="text"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="Dán đường dẫn ảnh (URL) để gửi kèm tin nhắn..."
                      className="flex-1 text-xs bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => {
                        setShowImageInput(false);
                        setImageUrlInput("");
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Bottom Input Box */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => setShowImageInput(!showImageInput)}
                    className={`p-2 rounded-xl transition-colors ${
                      showImageInput || imageUrlInput
                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    title="Đính kèm ảnh"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    id="chat-message-input"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={`Nhập tin nhắn gửi vào "${selectedRoom.name}"...`}
                    className="flex-1 py-2.5 px-4 text-xs bg-slate-100 dark:bg-slate-800 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                  />

                  <button
                    type="submit"
                    disabled={isSending || (!messageInput.trim() && !imageUrlInput.trim())}
                    className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-xs transition-all hover:scale-105 active:scale-95 shrink-0"
                    title="Gửi tin nhắn (Enter)"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

              </div>
            )}
          </>
        ) : (
          /* Empty state: No room selected */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/40 dark:bg-slate-900/40">
            <div className="w-16 h-16 rounded-3xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-sm">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
              Chào mừng bạn đến với Box Chat StageBiz
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
              Chọn một box chat ở danh sách bên trái hoặc tạo phòng mới để bắt đầu kết nối & phê duyệt thành viên.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all"
              >
                + Tạo Box Chat Mới
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-xs transition-all"
              >
                🔑 Nhập mã Code
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* MODAL: TẠO BOX CHAT MỚI                                   */}
      {/* ========================================================= */}
      {showCreateModal && createPortal(
        <div id="create-room-modal-portal" className="fixed inset-0 z-[9999] overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" 
            onClick={() => setShowCreateModal(false)}
            aria-hidden="true" 
          />

          {/* Centering container */}
          <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
            <div 
              className="relative transform overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 text-left shadow-2xl border border-slate-200 dark:border-slate-800 transition-all w-full max-w-md my-auto p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Tạo Box Chat Mới
                  </h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tên phòng chat <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Ví dụ: Team Tech StageBiz, Hội UI/UX Designer..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mã tham gia phòng (Tùy chọn mã ngắn)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newRoomCode}
                      onChange={(e) => setNewRoomCode(e.target.value.toUpperCase())}
                      placeholder="VD: TECH88, STAGE99 (Để trống sẽ tự tạo)"
                      className="flex-1 px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-600 dark:text-indigo-400 uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => setNewRoomCode(`ROOM${Math.floor(1000 + Math.random() * 9000)}`)}
                      className="px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0"
                    >
                      Tạo ngẫu nhiên
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Mã này sẽ dùng để chia sẻ cho các thành viên khác nhập và xin vào phòng.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mô tả phòng chat
                  </label>
                  <textarea
                    rows={2}
                    value={newRoomDesc}
                    onChange={(e) => setNewRoomDesc(e.target.value)}
                    placeholder="Mô tả mục đích hoạt động của nhóm..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Approval Checkbox */}
                <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/80 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="require-approval-cb"
                    checked={newRoomRequireApproval}
                    onChange={(e) => setNewRoomRequireApproval(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="require-approval-cb" className="cursor-pointer">
                    <span className="block text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      👑 Bật cơ chế Trưởng phòng duyệt
                    </span>
                    <span className="block text-[11px] text-indigo-800/80 dark:text-indigo-300/80 mt-0.5 leading-normal">
                      Khi người khác nhập mã phòng, họ sẽ vào hàng chờ và bạn (Trưởng phòng) sẽ quyết định Duyệt hoặc Từ chối trước khi họ có thể xem tin nhắn.
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingRoom || !newRoomName.trim()}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-102 cursor-pointer"
                  >
                    {isCreatingRoom ? "Đang tạo..." : "Xác nhận tạo phòng"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL: NHẬP MÃ THAM GIA PHÒNG CHAT                       */}
      {/* ========================================================= */}
      {showJoinModal && createPortal(
        <div id="join-room-modal-portal" className="fixed inset-0 z-[9999] overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" 
            onClick={() => setShowJoinModal(false)}
            aria-hidden="true" 
          />

          {/* Centering container */}
          <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
            <div 
              className="relative transform overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 text-left shadow-2xl border border-slate-200 dark:border-slate-800 transition-all w-full max-w-md my-auto p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Tham Gia Box Chat Bằng Mã
                  </h3>
                </div>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleJoinByCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nhập mã phòng chat <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: STAGEBIZ, DESIGN99..."
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-bold uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-600 dark:text-indigo-400 tracking-wider"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lời nhắn gửi Trưởng phòng (Tùy chọn)
                  </label>
                  <textarea
                    rows={2}
                    value={joinMessage}
                    onChange={(e) => setJoinMessage(e.target.value)}
                    placeholder="Ví dụ: Chào anh/chị, em xin vào giao lưu học hỏi công nghệ cùng team ạ..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <p>
                    Nếu phòng yêu cầu phê duyệt, yêu cầu của bạn sẽ được gửi tới Trưởng phòng. Bạn sẽ có thể trò chuyện ngay sau khi được duyệt!
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isJoiningRoom || !joinCode.trim()}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-102 cursor-pointer"
                  >
                    {isJoiningRoom ? "Đang gửi..." : "Gửi yêu cầu tham gia"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
