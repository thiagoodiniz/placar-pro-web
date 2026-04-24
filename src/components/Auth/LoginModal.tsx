import React, { useState } from 'react';
import { Modal, Form, Input, Button, Divider, message, Tabs } from 'antd';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface LoginModalProps {
    open: boolean;
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose }) => {
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', values);
            login(data.token, data.user);
            message.success('Bem-vindo!');
            onClose();
        } catch (err: any) {
            message.error(err.response?.data?.error || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    const onRegister = async (values: any) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', values);
            login(data.token, data.user);
            message.success('Conta criada com sucesso!');
            onClose();
        } catch (err: any) {
            message.error(err.response?.data?.error || 'Erro ao criar conta');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (response: any) => {
        try {
            const { data } = await api.post('/auth/google', { token: response.credential });
            login(data.token, data.user);
            message.success('Login com Google realizado!');
            onClose();
        } catch (err) {
            message.error('Erro no login com Google');
        }
    };

    return (
        <Modal
            title="Acesse sua conta"
            open={open}
            onCancel={onClose}
            footer={null}
            centered
            width={400}
        >
            <Tabs defaultActiveKey="login">
                <Tabs.TabPane tab="Login" key="login">
                    <Form layout="vertical" onFinish={onFinish}>
                        <Form.Item name="email" label="E-mail" rules={[{ required: true, type: 'email' }]}>
                            <Input placeholder="seu@email.com" />
                        </Form.Item>
                        <Form.Item name="password" label="Senha" rules={[{ required: true }]}>
                            <Input.Password placeholder="******" />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            Entrar
                        </Button>
                    </Form>
                </Tabs.TabPane>
                <Tabs.TabPane tab="Criar conta" key="register">
                    <Form layout="vertical" onFinish={onRegister}>
                        <Form.Item name="name" label="Nome" rules={[{ required: true }]}>
                            <Input placeholder="Seu nome" />
                        </Form.Item>
                        <Form.Item name="email" label="E-mail" rules={[{ required: true, type: 'email' }]}>
                            <Input placeholder="seu@email.com" />
                        </Form.Item>
                        <Form.Item name="password" label="Senha" rules={[{ required: true, min: 6 }]}>
                            <Input.Password placeholder="Mínimo 6 caracteres" />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            Cadastrar
                        </Button>
                    </Form>
                </Tabs.TabPane>
            </Tabs>

            <Divider>ou</Divider>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => message.error('Falha no login com Google')}
                    useOneTap
                    theme="filled_blue"
                    shape="pill"
                />
            </div>
        </Modal>
    );
};

export default LoginModal;
