import React, { useState } from 'react';
import { api } from '../utils/api';
import { auth } from '../utils/storage';

// 마이페이지 모달
export const MyPageScreen = ({ userProfile, onClose, onSave, token, onLogout }) => {
    const defaultProfilePic = "https://placehold.co/100x100/bcaaa4/795548?text=User";
    const [nickname, setNickname] = useState(userProfile.nickname);
    const [profilePic, setProfilePic] = useState(userProfile.profilePic);

    const handleSave = async () => {
        if (token) {
            try {
                const data = await api.updateProfile({
                        nickname,
                        profile_pic: profilePic || defaultProfilePic,
                });
                auth.setUser(data);
                    onSave({
                        nickname: data.nickname,
                        profilePic: data.profile_pic || defaultProfilePic,
                    });
                    onClose();
            } catch (error) {
                alert('프로필 업데이트 중 오류가 발생했습니다.');
            }
        } else {
        onSave({ nickname, profilePic });
        onClose();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePic(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="my-page-modal">
                <h2>프로필 설정</h2>
                <div className="profile-preview-area">
                    <img src={profilePic} alt="Profile Preview" className="profile-preview" />
                    <label htmlFor="profile-pic-upload" className="file-input-label" style={{ padding: '8px 12px', fontSize: '0.75rem' }}>
                        변경
                    </label>
                    <input
                        id="profile-pic-upload"
                        type="file"
                        accept="image/*"
                        className="file-input-hidden"
                        onChange={handleFileChange}
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="nickname">닉네임</label>
                    <input
                        id="nickname"
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="닉네임을 입력하세요"
                    />
                </div>
                <div className="logout-section">
                    <button className="logout-button-in-modal" onClick={onLogout}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                        </svg>
                        <span>로그아웃</span>
                    </button>
                </div>
                <div className="button-group">
                    <button className="close-button" onClick={onClose}>닫기</button>
                    <button className="save-button" onClick={handleSave}>저장</button>
                </div>
            </div>
        </div>
    );
};

export default MyPageScreen;

