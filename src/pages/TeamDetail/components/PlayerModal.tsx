import React from 'react';
import { Modal, Form, Input } from 'antd';

interface PlayerModalProps {
    open: boolean;
    onCancel: () => void;
    onFinish: (values: any) => void;
    form: any;
    isEdit: boolean;
}

const PlayerModal: React.FC<PlayerModalProps> = ({ open, onCancel, onFinish, form, isEdit }) => {
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
                <Form.Item name="photoUrl" label="URL da Foto">
                    <Input placeholder="https://exemplo.com/foto.jpg" style={{ borderRadius: 8 }} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default PlayerModal;
