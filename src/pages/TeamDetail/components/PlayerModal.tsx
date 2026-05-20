import React, { useRef } from 'react';
import { Modal, Form, Input, Upload, Button, Avatar, Space, message, Typography, Card, Row, Col } from 'antd';
import { UploadOutlined, UserOutlined, CloseOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { compressImage } from '../../../utils/imageUtils';
import { trackEvent } from '../../../services/analytics';
import { useAuth } from '../../../contexts/AuthContext';


const { Text } = Typography;

interface PlayerModalProps {
    open: boolean;
    onCancel: () => void;
    onFinish: (values: any) => void;
    form: any;
    isEdit: boolean;
    confirmLoading?: boolean;
}

const PlayerModal: React.FC<PlayerModalProps> = ({ open, onCancel, onFinish, form, isEdit, confirmLoading }) => {
    const { user } = useAuth();
    const canSeeDocument = user?.role && user.role !== 'USER';
    const scrollRef = useRef<HTMLDivElement>(null);

    const singlePhotoUrl = Form.useWatch('photoUrl', form);
    const playersList = Form.useWatch('players', form);

    const handleAddPlayer = (add: () => void) => {
        add();
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTo({
                    top: scrollRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 100);
    };

    const handleSubmit = (values: any) => {
        if (isEdit) {
            onFinish(values);
        } else {
            onFinish({ players: values.players || [] });
        }
    };

    return (
        <Modal
            title={isEdit ? "Editar Jogador" : "Adicionar Jogadores"}
            open={open}
            onCancel={() => {
                if (confirmLoading) return;
                onCancel();
            }}
            onOk={() => form.submit()}
            okText="Salvar"
            cancelText="Cancelar"
            centered
            destroyOnClose
            width={600}
            confirmLoading={confirmLoading}
            cancelButtonProps={{ disabled: confirmLoading }}
            closable={!confirmLoading}
            maskClosable={!confirmLoading}
            keyboard={!confirmLoading}
        >
            <div ref={scrollRef} style={{ maxHeight: '65vh', overflowY: 'auto', overflowX: 'hidden', paddingRight: 8 }}>
                <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
                    {isEdit ? (
                        <>
                            <Form.Item name="name" label="Nome Completo" rules={[{ required: true, message: 'Digite o nome' }]}>
                                <Input placeholder="Ex: Cristiano Ronaldo" style={{ borderRadius: 8 }} />
                            </Form.Item>
                            
                            <Row gutter={16}>
                                <Col xs={24} sm={canSeeDocument ? 12 : 24}>
                                    <Form.Item name="birthDate" label="Data de Nascimento">
                                        <Input type="date" style={{ width: '100%', borderRadius: 8 }} />
                                    </Form.Item>
                                </Col>
                                
                                {canSeeDocument && (
                                    <Col xs={24} sm={12}>
                                        <Form.Item name="document" label="Documento">
                                            <Input placeholder="RG, CPF ou Passaporte" style={{ borderRadius: 8 }} />
                                        </Form.Item>
                                    </Col>
                                )}
                            </Row>

                            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                                <Avatar 
                                    size={64} 
                                    src={singlePhotoUrl} 
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
                                        {singlePhotoUrl && (
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
                        </>
                    ) : (
                        <Form.List name="players" initialValue={[{}]}>
                            {(fields, { add, remove }) => (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {fields.map(({ key, name, ...restField }, index) => {
                                        const currentPhotoUrl = playersList?.[name]?.photoUrl;
                                        return (
                                            <Card key={key} size="small" style={{ borderRadius: 8, background: '#fbfbfb', border: '1px solid #f0f0f0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                    <Text strong>Jogador {index + 1}</Text>
                                                    {fields.length > 1 && (
                                                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} size="small" />
                                                    )}
                                                </div>
                                                
                                                <Form.Item {...restField} name={[name, 'name']} label="Nome Completo" rules={[{ required: true, message: 'Digite o nome' }]}>
                                                    <Input placeholder="Ex: Cristiano Ronaldo" style={{ borderRadius: 8 }} />
                                                </Form.Item>

                                                <Row gutter={16}>
                                                    <Col xs={24} sm={canSeeDocument ? 12 : 24}>
                                                        <Form.Item {...restField} name={[name, 'birthDate']} label="Data de Nasc.">
                                                            <Input type="date" style={{ width: '100%', borderRadius: 8 }} />
                                                        </Form.Item>
                                                    </Col>
                                                    
                                                    {canSeeDocument && (
                                                        <Col xs={24} sm={12}>
                                                            <Form.Item {...restField} name={[name, 'document']} label="Documento">
                                                                <Input placeholder="RG, CPF..." style={{ borderRadius: 8 }} />
                                                            </Form.Item>
                                                        </Col>
                                                    )}
                                                </Row>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                    <Avatar 
                                                        size={48} 
                                                        src={currentPhotoUrl} 
                                                        icon={<UserOutlined />} 
                                                        style={{ borderRadius: 12 }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <Space size="small">
                                                            <Upload
                                                                showUploadList={false}
                                                                beforeUpload={async (file) => {
                                                                    try {
                                                                        const base64 = await compressImage(file);
                                                                        const players = form.getFieldValue('players') || [];
                                                                        players[name] = { ...players[name], photoUrl: base64 };
                                                                        form.setFieldsValue({ players });
                                                                        trackEvent('image_uploaded', { type: 'player_photo' });
                                                                    } catch (err) {
                                                                        message.error('Erro ao processar imagem');
                                                                    }
                                                                    return false;
                                                                }}
                                                            >
                                                                <Button icon={<UploadOutlined />} size="small">Foto</Button>
                                                            </Upload>
                                                            {currentPhotoUrl && (
                                                                <Button 
                                                                    icon={<CloseOutlined />} 
                                                                    size="small"
                                                                    onClick={() => {
                                                                        const players = form.getFieldValue('players') || [];
                                                                        players[name] = { ...players[name], photoUrl: '' };
                                                                        form.setFieldsValue({ players });
                                                                    }}
                                                                    danger
                                                                />
                                                            )}
                                                        </Space>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                    <Button type="dashed" onClick={() => handleAddPlayer(add)} block icon={<PlusOutlined />} style={{ borderRadius: 8 }}>
                                        Adicionar mais um jogador
                                    </Button>
                                </div>
                            )}
                        </Form.List>
                    )}
                </Form>
            </div>
        </Modal>
    );
};

export default PlayerModal;
