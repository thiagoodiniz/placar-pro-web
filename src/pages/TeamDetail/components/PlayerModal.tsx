import React from 'react';
import { Modal, Form, Input, Upload, Button, Avatar, Space, message } from 'antd';
import { UploadOutlined, UserOutlined, CloseOutlined } from '@ant-design/icons';
import { compressImage } from '../../../utils/imageUtils';
import { trackEvent } from '../../../services/analytics';

interface PlayerModalProps {
    open: boolean;
    onCancel: () => void;
    onFinish: (values: any) => void;
    form: any;
    isEdit: boolean;
}

const PlayerModal: React.FC<PlayerModalProps> = ({ open, onCancel, onFinish, form, isEdit }) => {
    const photoUrl = Form.useWatch('photoUrl', form);

    return (
        <Modal
            title={isEdit ? "Editar Jogador" : "Novo Jogador"}
            open={open}
            onCancel={onCancel}
            onOk={() => form.submit()}
            okText="Salvar"
            cancelText="Cancelar"
            centered
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 16 }}>
                <Form.Item name="name" label="Nome Completo" rules={[{ required: true, message: 'Digite o nome' }]}>
                    <Input placeholder="Ex: Cristiano Ronaldo" style={{ borderRadius: 8 }} />
                </Form.Item>
                
                <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Avatar 
                        size={64} 
                        src={photoUrl} 
                        icon={<UserOutlined />} 
                        style={{ borderRadius: 12 }}
                    />
                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Foto do Jogador</div>
                        <Space size="small">
                            <Upload
                                showUploadList={false}
                                beforeUpload={async (file) => {
                                    try {
                                        const base64 = await compressImage(file);
                                        form.setFieldsValue({ photoUrl: base64 });
                                        trackEvent('image_uploaded', { type: 'player_photo' });
                                    } catch (err) {
                                        message.error('Erro ao processar imagem');
                                    }
                                    return false;
                                }}
                            >
                                <Button icon={<UploadOutlined />} size="small">Alterar Foto</Button>
                            </Upload>
                            {photoUrl && (
                                <Button 
                                    icon={<CloseOutlined />} 
                                    size="small"
                                    onClick={() => form.setFieldsValue({ photoUrl: '' })}
                                    danger
                                >
                                    Remover
                                </Button>
                            )}
                        </Space>
                        <Form.Item name="photoUrl" hidden>
                            <Input />
                        </Form.Item>
                    </div>
                </div>
            </Form>
        </Modal>
    );
};

export default PlayerModal;
